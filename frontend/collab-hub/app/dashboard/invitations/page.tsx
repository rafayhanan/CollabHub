import { InvitationList } from "@/components/users/invitation-list"

export default function InvitationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Invitations</h1>
        <p className="text-muted-foreground">Manage your project invitations</p>
      </div>

      <InvitationList />
    </div>
  )
}
