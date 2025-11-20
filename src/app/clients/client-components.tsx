"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createClient, updateClient, deleteClient } from "../actions/clients";
import { Plus, MoreVertical, Pencil, Trash2, Search, Phone, Mail } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

type Client = {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  pets: Array<{ id: string }>;
};

export function ClientsPageContent({ clients }: { clients: Client[] }) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredClients = clients.filter((client) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      client.firstName.toLowerCase().includes(searchLower) ||
      client.lastName.toLowerCase().includes(searchLower) ||
      client.email?.toLowerCase().includes(searchLower) ||
      client.phone?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <main className="flex flex-1 flex-col overflow-hidden">
      {/* Header */}
      <header className="border-b bg-background">
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex flex-1 items-center gap-4">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search clients..."
                className="pl-9 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <AddClientDialog />
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-semibold">Clients</h1>
            <p className="text-muted-foreground mt-1">
              Manage your client database
            </p>
          </div>

          {/* Clients List */}
          {filteredClients.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-muted-foreground mb-4">
                {searchTerm
                  ? "No clients found matching your search."
                  : "No clients yet. Add your first client to get started."}
              </p>
              {!searchTerm && <AddClientDialog />}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredClients.map((client) => (
                <ClientCard key={client.id} client={client} />
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function ClientCard({ client }: { client: Client }) {
  return (
    <div className="rounded-lg border p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <Link href={`/clients/${client.id}`} className="flex-1">
          <h3 className="font-semibold text-lg hover:text-primary transition-colors">
            {client.firstName} {client.lastName}
          </h3>
        </Link>
        <div className="flex items-center gap-1">
          {client.phone && (
            <a
              href={`tel:${client.phone}`}
              className="p-1.5 hover:bg-gray-100 rounded"
              onClick={(e) => e.stopPropagation()}
            >
              <Phone className="h-4 w-4 text-muted-foreground" />
            </a>
          )}
          {client.email && (
            <a
              href={`mailto:${client.email}`}
              className="p-1.5 hover:bg-gray-100 rounded"
              onClick={(e) => e.stopPropagation()}
            >
              <Mail className="h-4 w-4 text-muted-foreground" />
            </a>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <EditClientDialog client={client} />
              <DeleteClientDialog client={client} />
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <Link href={`/clients/${client.id}`}>
        <div className="mt-2 space-y-1 text-sm text-muted-foreground">
          {client.email && <p>{client.email}</p>}
          {client.phone && <p>{client.phone}</p>}
          <p className="mt-2">
            {client.pets.length} pet{client.pets.length !== 1 ? "s" : ""}
          </p>
        </div>
      </Link>
    </div>
  );
}

function AddClientDialog() {
  const [open, setOpen] = useState(false);

  async function handleSubmit(formData: FormData) {
    try {
      await createClient(formData);
      setOpen(false);
      toast.success("Client added successfully");
    } catch (error) {
      toast.error("Failed to add client");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Client
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Client</DialogTitle>
          <DialogDescription>
            Enter the client's information below.
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name *</Label>
            <Input id="firstName" name="firstName" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name *</Label>
            <Input id="lastName" name="lastName" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" name="phone" type="tel" />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Add Client</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditClientDialog({ client }: { client: Client }) {
  const [open, setOpen] = useState(false);

  async function handleSubmit(formData: FormData) {
    try {
      await updateClient(client.id, formData);
      setOpen(false);
      toast.success("Client updated successfully");
    } catch (error) {
      toast.error("Failed to update client");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
          <Pencil className="h-4 w-4 mr-2" />
          Edit
        </DropdownMenuItem>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Client</DialogTitle>
          <DialogDescription>
            Update the client's information below.
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-firstName">First Name *</Label>
            <Input
              id="edit-firstName"
              name="firstName"
              defaultValue={client.firstName}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-lastName">Last Name *</Label>
            <Input
              id="edit-lastName"
              name="lastName"
              defaultValue={client.lastName}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-email">Email</Label>
            <Input
              id="edit-email"
              name="email"
              type="email"
              defaultValue={client.email || ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-phone">Phone</Label>
            <Input
              id="edit-phone"
              name="phone"
              type="tel"
              defaultValue={client.phone || ""}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Save Changes</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteClientDialog({ client }: { client: Client }) {
  const [open, setOpen] = useState(false);

  async function handleDelete() {
    try {
      await deleteClient(client.id);
      setOpen(false);
      toast.success("Client deleted successfully");
    } catch (error) {
      toast.error("Failed to delete client");
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <DropdownMenuItem
          onSelect={(e) => e.preventDefault()}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete
        </DropdownMenuItem>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Client</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete {client.firstName} {client.lastName}?
            This will also delete all their pets and appointments. This action
            cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
