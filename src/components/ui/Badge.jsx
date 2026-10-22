// tone: neutral | light | brand | brand-soft | champagne | champagne-soft | ok
export default function Badge({ tone = 'neutral', className = '', children, ...rest }) {
  return <span className={`badge badge--${tone} ${className}`.trim()} {...rest}>{children}</span>
}
