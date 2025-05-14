"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowUpDown, Edit, MoreHorizontal, Shield, ShieldAlert, Trash, UserX } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import { updateUserRole, toggleUserBlock, deleteUser } from "@/lib/auth"
import type { UserProfile } from "@/lib/auth"

interface AdminUsersTableProps {
  users: UserProfile[]
}

export function AdminUsersTable({ users }: AdminUsersTableProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [sortBy, setSortBy] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")

  // Dialog states
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false)
  const [isBlockDialogOpen, setIsBlockDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortBy(column)
      setSortDirection("asc")
    }
  }

  const handleMakeAdmin = async () => {
    if (!selectedUser) return

    setIsProcessing(true)
    try {
      await updateUserRole(selectedUser.id, "admin")
      toast({
        title: "Role updated",
        description: `${selectedUser.email} is now an admin.`,
      })
      setIsRoleDialogOpen(false)
      router.refresh()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update user role",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleMakeUser = async () => {
    if (!selectedUser) return

    setIsProcessing(true)
    try {
      await updateUserRole(selectedUser.id, "user")
      toast({
        title: "Role updated",
        description: `${selectedUser.email} is now a regular user.`,
      })
      setIsRoleDialogOpen(false)
      router.refresh()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update user role",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleToggleBlock = async () => {
    if (!selectedUser) return

    setIsProcessing(true)
    try {
      await toggleUserBlock(selectedUser.id, !selectedUser.is_blocked)
      toast({
        title: selectedUser.is_blocked ? "User unblocked" : "User blocked",
        description: selectedUser.is_blocked
          ? `${selectedUser.email} has been unblocked.`
          : `${selectedUser.email} has been blocked.`,
      })
      setIsBlockDialogOpen(false)
      router.refresh()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update user status",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDeleteUser = async () => {
    if (!selectedUser) return

    setIsProcessing(true)
    try {
      await deleteUser(selectedUser.id)
      toast({
        title: "User deleted",
        description: `${selectedUser.email} has been deleted.`,
      })
      setIsDeleteDialogOpen(false)
      router.refresh()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete user",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[250px]">
                <div className="flex items-center cursor-pointer" onClick={() => handleSort("email")}>
                  Email
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </div>
              </TableHead>
              <TableHead>Name</TableHead>
              <TableHead>
                <div className="flex items-center cursor-pointer" onClick={() => handleSort("role")}>
                  Role
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </div>
              </TableHead>
              <TableHead>
                <div className="flex items-center cursor-pointer" onClick={() => handleSort("is_blocked")}>
                  Status
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </div>
              </TableHead>
              <TableHead>
                <div className="flex items-center cursor-pointer" onClick={() => handleSort("created_at")}>
                  Joined
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </div>
              </TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.email}</TableCell>
                <TableCell>{user.full_name || "N/A"}</TableCell>
                <TableCell>
                  <Badge className={user.role === "admin" ? "bg-purple-500" : "bg-blue-500"}>
                    {user.role === "admin" ? "Admin" : "User"}
                  </Badge>
                </TableCell>
                <TableCell>
                  {user.is_blocked ? (
                    <Badge variant="destructive">Blocked</Badge>
                  ) : (
                    <Badge variant="outline" className="bg-green-500 text-white">
                      Active
                    </Badge>
                  )}
                </TableCell>
                <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem asChild>
                        <Link href={`/admin/users/edit/${user.id}`}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit User
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedUser(user)
                          setIsRoleDialogOpen(true)
                        }}
                      >
                        <Shield className="mr-2 h-4 w-4" />
                        Change Role
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedUser(user)
                          setIsBlockDialogOpen(true)
                        }}
                      >
                        {user.is_blocked ? (
                          <>
                            <Shield className="mr-2 h-4 w-4 text-green-500" />
                            Unblock User
                          </>
                        ) : (
                          <>
                            <UserX className="mr-2 h-4 w-4 text-red-500" />
                            Block User
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedUser(user)
                          setIsDeleteDialogOpen(true)
                        }}
                        className="text-red-600"
                      >
                        <Trash className="mr-2 h-4 w-4" />
                        Delete User
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {users.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No users found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Change Role Dialog */}
      <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change User Role</DialogTitle>
            <DialogDescription>Change the role for {selectedUser?.email}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="font-medium">Regular User</p>
                  <p className="text-sm text-muted-foreground">Can book products and place orders</p>
                </div>
              </div>
              <Button
                variant={selectedUser?.role === "user" ? "default" : "outline"}
                onClick={handleMakeUser}
                disabled={isProcessing || selectedUser?.role === "user"}
              >
                {selectedUser?.role === "user" ? "Current" : "Set as User"}
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-purple-500" />
                <div>
                  <p className="font-medium">Administrator</p>
                  <p className="text-sm text-muted-foreground">Full access to manage the system</p>
                </div>
              </div>
              <Button
                variant={selectedUser?.role === "admin" ? "default" : "outline"}
                onClick={handleMakeAdmin}
                disabled={isProcessing || selectedUser?.role === "admin"}
              >
                {selectedUser?.role === "admin" ? "Current" : "Set as Admin"}
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRoleDialogOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Block/Unblock Dialog */}
      <Dialog open={isBlockDialogOpen} onOpenChange={setIsBlockDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedUser?.is_blocked ? "Unblock User" : "Block User"}</DialogTitle>
            <DialogDescription>
              {selectedUser?.is_blocked
                ? "This will allow the user to access the system again."
                : "This will prevent the user from accessing the system."}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              {selectedUser?.is_blocked
                ? "Are you sure you want to unblock this user?"
                : "Are you sure you want to block this user? They will be logged out and unable to log in again until unblocked."}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBlockDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant={selectedUser?.is_blocked ? "default" : "destructive"}
              onClick={handleToggleBlock}
              disabled={isProcessing}
            >
              {isProcessing ? "Processing..." : selectedUser?.is_blocked ? "Unblock User" : "Block User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this user? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              User: <span className="font-medium">{selectedUser?.email}</span>
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteUser} disabled={isProcessing}>
              {isProcessing ? "Processing..." : "Delete User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
