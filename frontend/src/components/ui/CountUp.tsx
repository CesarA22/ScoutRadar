import { useEffect, useState } from 'react'
import { motion, useSpring, useTransform } from 'framer-motion'

interface CountUpProps {
  value: number
  decimals?: number
  className?: string
}

export function CountUp({ value, decimals = 0, className = '' }: CountUpProps) {
  const spring = useSpring(0, { stiffness: 80, damping: 20 })
  const display = useTransform(spring, v => (decimals > 0 ? v.toFixed(decimals) : Math.round(v).toString()))
  const [text, setText] = useState('0')

  useEffect(() => {
    spring.set(value)
  }, [value, spring])

  useEffect(() => {
    return display.on('change', v => setText(v))
  }, [display])

  return <motion.span className={className}>{text}</motion.span>
}
