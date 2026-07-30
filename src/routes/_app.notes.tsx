import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/notes')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_app/notes"!</div>
}
