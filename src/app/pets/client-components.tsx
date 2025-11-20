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
import { createPet, updatePet, deletePet } from "../actions/pets";
import { Plus, MoreVertical, Pencil, Trash2, Search, PawPrint, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { SearchableSelect } from "@/components/ui/searchable-select";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Client = {
  id: string;
  firstName: string;
  lastName: string;
};

type Pet = {
  id: string;
  name: string;
  breed: string | null;
  species: string;
  age: number | null;
  notes: string | null;
  clientId: string;
  client: Client;
  appointments: Array<{ id: string }>;
};

export function PetsPageContent({
  pets,
  clients,
  total,
  page,
  totalPages,
  itemsPerPage,
}: {
  pets: Pet[];
  clients: Client[];
  total: number;
  page: number;
  totalPages: number;
  itemsPerPage: number;
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();

  const filteredPets = pets.filter((pet) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      pet.name.toLowerCase().includes(searchLower) ||
      pet.species.toLowerCase().includes(searchLower) ||
      pet.breed?.toLowerCase().includes(searchLower) ||
      pet.client.firstName.toLowerCase().includes(searchLower) ||
      pet.client.lastName.toLowerCase().includes(searchLower)
    );
  });

  const handlePageChange = (newPage: number) => {
    router.push(`/pets?page=${newPage}`);
  };

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
                placeholder="Search pets..."
                className="pl-9 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <AddPetDialog clients={clients} />
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-semibold">Pets</h1>
            <p className="text-muted-foreground mt-1">
              Track pet information and preferences
            </p>
          </div>

          {/* Pets List */}
          {filteredPets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <PawPrint className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                {searchTerm
                  ? "No pets found matching your search."
                  : "No pets yet. Add your first pet to get started."}
              </p>
              {!searchTerm && <AddPetDialog clients={clients} />}
            </div>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredPets.map((pet) => (
                  <PetCard key={pet.id} pet={pet} clients={clients} />
                ))}
              </div>

              {/* Pagination - only show when not searching */}
              {!searchTerm && totalPages > 1 && (
                <div className="mt-8 flex items-center justify-between border-t pt-6">
                  <p className="text-sm text-muted-foreground">
                    Showing {(page - 1) * itemsPerPage + 1} to{" "}
                    {Math.min(page * itemsPerPage, total)} of {total} pets
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(page - 1)}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter((p) => {
                          // Show first page, last page, current page, and 1 page on each side of current
                          return (
                            p === 1 ||
                            p === totalPages ||
                            (p >= page - 1 && p <= page + 1)
                          );
                        })
                        .map((p, idx, arr) => {
                          // Add ellipsis when there's a gap
                          const prevPage = arr[idx - 1];
                          const showEllipsis = prevPage && p - prevPage > 1;

                          return (
                            <div key={p} className="flex items-center gap-1">
                              {showEllipsis && (
                                <span className="px-2 text-muted-foreground">
                                  ...
                                </span>
                              )}
                              <Button
                                variant={p === page ? "default" : "outline"}
                                size="sm"
                                onClick={() => handlePageChange(p)}
                                className="min-w-[40px]"
                              >
                                {p}
                              </Button>
                            </div>
                          );
                        })}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(page + 1)}
                      disabled={page === totalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  );
}

function PetCard({ pet, clients }: { pet: Pet; clients: Client[] }) {
  return (
    <div className="relative rounded-lg border hover:shadow-md transition-shadow">
      <Link href={`/pets/${pet.id}`} className="block p-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-lg">{pet.name}</h3>
            <p className="text-sm text-muted-foreground">
              {pet.species}
              {pet.breed && ` • ${pet.breed}`}
            </p>
          </div>
          {/* Spacer for dropdown button */}
          <div className="h-8 w-8" />
        </div>
        <div className="mt-3 space-y-1 text-sm text-muted-foreground">
          <p>
            Owner: {pet.client.firstName} {pet.client.lastName}
          </p>
          {pet.age && <p>Age: {pet.age} years</p>}
          <p className="mt-2">
            {pet.appointments.length} appointment
            {pet.appointments.length !== 1 ? "s" : ""}
          </p>
        </div>
      </Link>
      {/* Dropdown positioned absolutely to not interfere with Link */}
      <div className="absolute top-4 right-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <EditPetDialog pet={pet} clients={clients} />
            <DeletePetDialog pet={pet} />
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

function AddPetDialog({ clients }: { clients: Client[] }) {
  const [open, setOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState("");

  const clientOptions = clients.map((client) => ({
    value: client.id,
    label: `${client.firstName} ${client.lastName}`,
  }));

  async function handleSubmit(formData: FormData) {
    if (!selectedClientId) {
      toast.error("Please select an owner");
      return;
    }

    formData.set("clientId", selectedClientId);

    try {
      await createPet(formData);
      setOpen(false);
      setSelectedClientId("");
      toast.success("Pet added successfully");
    } catch {
      toast.error("Failed to add pet");
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (!isOpen) setSelectedClientId("");
    }}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Pet
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Pet</DialogTitle>
          <DialogDescription>
            Enter the pet's information below.
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Owner *</Label>
            <SearchableSelect
              options={clientOptions}
              value={selectedClientId}
              onValueChange={setSelectedClientId}
              placeholder="Search for an owner..."
              searchPlaceholder="Type owner name..."
              emptyMessage="No clients found."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Pet Name *</Label>
            <Input id="name" name="name" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="species">Species *</Label>
            <select
              id="species"
              name="species"
              required
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">Select species</option>
              <option value="dog">Dog</option>
              <option value="cat">Cat</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="breed">Breed</Label>
            <Input id="breed" name="breed" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="age">Age (years)</Label>
            <Input id="age" name="age" type="number" min="0" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Add Pet</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditPetDialog({ pet, clients }: { pet: Pet; clients: Client[] }) {
  const [open, setOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState(pet.clientId);

  const clientOptions = clients.map((client) => ({
    value: client.id,
    label: `${client.firstName} ${client.lastName}`,
  }));

  async function handleSubmit(formData: FormData) {
    if (!selectedClientId) {
      toast.error("Please select an owner");
      return;
    }

    formData.set("clientId", selectedClientId);

    try {
      await updatePet(pet.id, formData);
      setOpen(false);
      toast.success("Pet updated successfully");
    } catch {
      toast.error("Failed to update pet");
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (!isOpen) setSelectedClientId(pet.clientId);
    }}>
      <DialogTrigger asChild>
        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
          <Pencil className="h-4 w-4 mr-2" />
          Edit
        </DropdownMenuItem>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Pet</DialogTitle>
          <DialogDescription>
            Update the pet's information below.
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Owner *</Label>
            <SearchableSelect
              options={clientOptions}
              value={selectedClientId}
              onValueChange={setSelectedClientId}
              placeholder="Search for an owner..."
              searchPlaceholder="Type owner name..."
              emptyMessage="No clients found."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-name">Pet Name *</Label>
            <Input
              id="edit-name"
              name="name"
              defaultValue={pet.name}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-species">Species *</Label>
            <select
              id="edit-species"
              name="species"
              required
              defaultValue={pet.species}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">Select species</option>
              <option value="dog">Dog</option>
              <option value="cat">Cat</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-breed">Breed</Label>
            <Input
              id="edit-breed"
              name="breed"
              defaultValue={pet.breed || ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-age">Age (years)</Label>
            <Input
              id="edit-age"
              name="age"
              type="number"
              min="0"
              defaultValue={pet.age || ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-notes">Notes</Label>
            <textarea
              id="edit-notes"
              name="notes"
              rows={3}
              defaultValue={pet.notes || ""}
              className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
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

function DeletePetDialog({ pet }: { pet: Pet }) {
  const [open, setOpen] = useState(false);

  async function handleDelete() {
    try {
      await deletePet(pet.id);
      setOpen(false);
      toast.success("Pet deleted successfully");
    } catch (error) {
      toast.error("Failed to delete pet");
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
          <AlertDialogTitle>Delete Pet</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete {pet.name}? This will also delete all
            their appointments. This action cannot be undone.
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
