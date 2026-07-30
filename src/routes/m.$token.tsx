import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/m/$token')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/m/$token"!</div>
}
