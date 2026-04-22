import { Billboard, Text } from '@react-three/drei'
import { useGame } from '../game/store'

export function DamageNumbers() {
  const nums = useGame((s) => s.damageNumbers)
  return (
    <group>
      {nums.map((d) => {
        const alpha = 1 - d.age / 1.1
        return (
          <Billboard key={d.id} position={d.pos}>
            <Text
              fontSize={d.isCrit ? 0.6 : 0.4}
              color={d.color}
              outlineColor="#000"
              outlineWidth={0.03}
              fillOpacity={alpha}
              outlineOpacity={alpha}
              anchorX="center"
              anchorY="middle"
            >
              {d.amount > 0 ? String(d.amount) : '★'}
            </Text>
          </Billboard>
        )
      })}
    </group>
  )
}
