"""Fetch player images from Wikidata/Wikimedia Commons."""
import logging
import time

import requests
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.db.models import Player, PlayerImage
from app.services.player_service import get_active_run

logger = logging.getLogger(__name__)

WIKIDATA_API = "https://www.wikidata.org/w/api.php"
COMMONS_API = "https://commons.wikimedia.org/w/api.php"


def _search_wikidata(name: str) -> str | None:
    params = {
        "action": "wbsearchentities",
        "search": name,
        "language": "pt",
        "format": "json",
        "limit": 1,
    }
    r = requests.get(WIKIDATA_API, params=params, timeout=10)
    r.raise_for_status()
    results = r.json().get("search", [])
    return results[0]["id"] if results else None


def _get_image_url(qid: str) -> tuple[str | None, str | None]:
    params = {
        "action": "wbgetclaims",
        "format": "json",
        "property": "P18",
        "entity": qid,
    }
    r = requests.get(WIKIDATA_API, params=params, timeout=10)
    r.raise_for_status()
    claims = r.json().get("claims", {}).get("P18", [])
    if not claims:
        return None, None
    filename = claims[0]["mainsnak"]["datavalue"]["value"]
    params = {
        "action": "query",
        "titles": f"File:{filename}",
        "prop": "imageinfo",
        "iiprop": "url",
        "format": "json",
    }
    r = requests.get(COMMONS_API, params=params, timeout=10)
    r.raise_for_status()
    pages = r.json().get("query", {}).get("pages", {})
    for page in pages.values():
        info = page.get("imageinfo", [])
        if info:
            return info[0].get("url"), "Wikimedia Commons"
    return None, None


def fetch_images(db: Session, limit: int = 50) -> int:
    run = get_active_run(db)
    if not run:
        return 0

    players = db.scalars(
        select(Player)
        .where(Player.dataset_run_id == run.id)
        .options(joinedload(Player.image))
    ).unique().all()

    count = 0
    for player in players:
        if player.image and player.image.image_url:
            continue
        if player.name.startswith("Jogador "):
            continue
        try:
            qid = _search_wikidata(player.name)
            if not qid:
                continue
            url, license_ = _get_image_url(qid)
            if not url:
                continue
            if player.image:
                player.image.wikidata_qid = qid
                player.image.image_url = url
                player.image.license = license_
            else:
                db.add(PlayerImage(player_id=player.id, wikidata_qid=qid, image_url=url, license=license_))
            count += 1
            time.sleep(0.5)
        except Exception as e:
            logger.debug("Image fetch failed for %s: %s", player.name, e)
    db.commit()
    return count


if __name__ == "__main__":
    from app.db.session import SessionLocal

    logging.basicConfig(level=logging.INFO)
    db = SessionLocal()
    try:
        n = fetch_images(db)
        logger.info("Fetched %d images", n)
    finally:
        db.close()
