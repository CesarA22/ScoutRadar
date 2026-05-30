import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { api } from '../api/client'
import { FiltersDrawer, FiltersDrawerTrigger } from './FiltersDrawer'

export function PageFilters() {
  const [open, setOpen] = useState(false)

  const { data: filterOpts } = useQuery({
    queryKey: ['filters'],
    queryFn: () => api.getFilters(),
  })

  return (
    <>
      <FiltersDrawerTrigger onClick={() => setOpen(true)} />
      <FiltersDrawer
        open={open}
        onClose={() => setOpen(false)}
        availableTeams={filterOpts?.teams ?? []}
        availableClusters={filterOpts?.clusters ?? []}
        availableSeasons={filterOpts?.seasons ?? [2023, 2024]}
      />
    </>
  )
}
