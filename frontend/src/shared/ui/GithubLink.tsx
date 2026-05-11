import githubLogo from '../../assets/github.svg'

interface GithubLinkProps {
  size?: 'small' | 'medium'
  className?: string
}

const SIZE_STYLES = {
  small: {
    wrapper:
      'inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] text-gray-400 hover:text-gray-600 hover:bg-gray-100',
    icon: 'h-3 w-3',
  },
  medium: {
    wrapper:
      'inline-flex items-center gap-1.5 rounded-md px-2 py-1 md:px-2.5 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100',
    icon: 'h-4 w-4',
  },
} as const

export default function GithubLink({ size = 'medium', className = '' }: GithubLinkProps) {
  const style = SIZE_STYLES[size]

  return (
    <a
      href="https://github.com/wndgur2"
      target="_blank"
      rel="noreferrer"
      className={`${style.wrapper} transition-colors ${className}`.trim()}
      aria-label="Visit wndgur2 GitHub profile"
      title="wndgur2 on GitHub"
    >
      <img src={githubLogo} alt="" className={style.icon} aria-hidden="true" />
      <span>wndgur2</span>
    </a>
  )
}
