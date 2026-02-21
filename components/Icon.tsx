import {
  HiUser,
  HiArrowLeft,
  HiCog,
  HiBell,
  HiPlusCircle,
  HiFolder,
  HiChartBar,
  HiSearch,
  HiDownload,
  HiLink,
  HiLightningBolt,
  HiSparkles,
  HiCode,
  HiCheckCircle,
  HiXCircle,
  HiStop,
  HiClock,
  HiRefresh,
  HiExternalLink,
  HiPlay,
  HiTranslate,
  HiInbox,
  HiArrowRight,
} from 'react-icons/hi'
import { HiLanguage } from 'react-icons/hi2'
import { MdAccountTree, MdDiamond } from 'react-icons/md'

type Props = {
  name: string
  className?: string
  size?: number
}

// Map Material Symbols names to react-icons components
const iconMap: Record<string, React.ComponentType<{ className?: string; size?: number }>> = {
  language: HiLanguage,
  person: HiUser,
  arrow_back: HiArrowLeft,
  settings: HiCog,
  notifications: HiBell,
  add_circle: HiPlusCircle,
  add: HiPlusCircle,
  folder: HiFolder,
  analytics: HiChartBar,
  dashboard: HiChartBar,
  search: HiSearch,
  download: HiDownload,
  link: HiLink,
  bolt: HiLightningBolt,
  auto_fix_high: HiSparkles,
  merge: HiCode,
  account_tree: MdAccountTree,
  translate: HiTranslate,
  open_in_new: HiExternalLink,
  play_circle: HiPlay,
  stop_circle: HiStop,
  check_circle: HiCheckCircle,
  error: HiXCircle,
  schedule: HiClock,
  refresh: HiRefresh,
  progress_activity: HiRefresh,
  diamond: MdDiamond,
  inbox: HiInbox,
  arrow_forward_ios: HiArrowRight,
  check: HiCheckCircle,
  terminal: HiCode,
  sync: HiRefresh,
}

export default function Icon({ name, className = '', size = 24 }: Props) {
  const IconComponent = iconMap[name] || HiLanguage

  return <IconComponent className={className} size={size} />
}
