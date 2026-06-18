import { createLazyFileRoute } from '@tanstack/react-router'
import { ConfigurationView } from '../../pages/Settings/configuration'

export const Route = createLazyFileRoute('/settings/configuration')({
  component: ConfigurationView,
})
