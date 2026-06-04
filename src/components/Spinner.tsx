interface SpinnerProps {
  size?: number
  borderWidth?: number
}

export default function Spinner({ size = 26, borderWidth = 2.5 }: SpinnerProps) {
  return (
    <div
      className="spinner"
      style={{ width: size, height: size, borderWidth }}
    />
  )
}
