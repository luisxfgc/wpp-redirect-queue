"use client";

import { useState, useEffect } from 'react';
import { UserButton } from "@clerk/nextjs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Moon, Sun, Plus, Pencil, Trash2, ChevronDown } from "lucide-react";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface Phone {
  id: string;
  number: string;
  name?: string;
  online: boolean;
  lastOnline: string;
  lastOnlineChange: string;
  lastOffline: string | null;
  createdAt: string;
}

export default function PhonesPage() {
  const [mounted, setMounted] = useState(false);
  const [phones, setPhones] = useState<Phone[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPhone, setEditingPhone] = useState<Phone | null>(null);
  const [newPhone, setNewPhone] = useState({ number: '', name: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { theme, setTheme } = useTheme();

  const formatLastOnline = (date: string) => {
    const formattedDistance = formatDistanceToNow(new Date(date), { 
      locale: ptBR, 
      addSuffix: true 
    });
    return formattedDistance.replace('cerca de ', '');
  };

  const fetchPhones = async () => {
    try {
      const response = await fetch('/api/phones');
      const data = await response.json();
      setPhones(data);
    } catch (error) {
      setError('Erro ao carregar números');
    }
  };

  useEffect(() => {
    fetchPhones();
  }, []);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/phones', {
        method: editingPhone ? 'PATCH' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editingPhone ? {
          id: editingPhone.id,
          name: newPhone.name,
          number: newPhone.number
        } : newPhone),
      });

      if (!response.ok) {
        throw new Error(editingPhone ? 'Erro ao atualizar número' : 'Erro ao adicionar número');
      }

      await fetchPhones();
      setIsDialogOpen(false);
      setNewPhone({ number: '', name: '' });
      setEditingPhone(null);
    } catch (error) {
      setError(editingPhone ? 'Erro ao atualizar número' : 'Erro ao adicionar número');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (phone: Phone) => {
    setEditingPhone(phone);
    setNewPhone({ number: phone.number, name: phone.name || '' });
    setIsDialogOpen(true);
  };

  const handleDelete = async (phoneId: string) => {
    try {
      const response = await fetch('/api/phones', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: phoneId }),
      });

      if (!response.ok) {
        throw new Error('Erro ao deletar número');
      }

      await fetchPhones();
    } catch (error) {
      setError('Erro ao deletar número');
    }
  };

  const handleBulkStatusChange = async (newStatus: boolean, phonesToUpdate: Phone[]) => {
    setLoading(true);
    try {
      await Promise.all(
        phonesToUpdate.map(phone =>
          fetch('/api/phones', {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              id: phone.id,
              online: newStatus,
            }),
          })
        )
      );
      await fetchPhones();
    } catch (error) {
      setError('Erro ao atualizar status dos números');
    } finally {
      setLoading(false);
    }
  };

  const onlinePhones = phones.filter(phone => phone.online);
  const offlinePhones = phones.filter(phone => !phone.online);

  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-8 border-b">
        <div className="container flex h-16 items-center max-w-5xl">
          <h1 className="text-xl font-semibold">WPP Redirect</h1>
          <div className="ml-auto flex items-center gap-4">
            <Button
              onClick={() => {
                setEditingPhone(null);
                setNewPhone({ number: '', name: '' });
                setIsDialogOpen(true);
              }}
              variant="default"
              size="default"
              className="h-9 px-4 rounded-full"
            >
              <Plus className="h-4 w-4 mr-2" strokeWidth={2.5} />
              <span>Novo Número</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full w-10 h-10"
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            >
              <span className="sr-only">Alternar tema</span>
              {mounted && (
                theme === "light" ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )
              )}
            </Button>
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </nav>

      <main className="container py-8 max-w-5xl">
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 p-4 bg-destructive/10 text-destructive rounded-lg text-sm"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="space-y-3">
          {onlinePhones.length > 0 && (
            <Accordion type="single" collapsible defaultValue="online" className="mb-8">
              <AccordionItem value="online" className="border-none">
                <div className="flex items-center justify-between">
                  <AccordionTrigger className="p-0 hover:no-underline">
                    <h2 className="text-lg font-medium">Números Online ({onlinePhones.length})</h2>
                  </AccordionTrigger>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8"
                    onClick={() => handleBulkStatusChange(false, onlinePhones)}
                    disabled={loading}
                  >
                    Desativar Todos
                  </Button>
                </div>
                <AccordionContent className="pt-3">
                  <div className="space-y-1.5">
                    {onlinePhones.map((phone) => (
                      <motion.div
                        key={phone.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        <Card className="shadow-none border-0 bg-secondary/80 hover:bg-secondary/60 transition-colors">
                          <CardContent className="px-4 py-2">
                            <div className="flex items-center justify-between">
                              <div className="space-y-1">
                                <p className="text-lg font-medium text-foreground">
                                  {phone.number}
                                </p>
                                <h3 className="text-sm text-muted-foreground">
                                  {phone.name || 'Sem nome'}
                                </h3>
                                <p className="text-xs text-muted-foreground">
                                  Online {formatLastOnline(phone.lastOnlineChange)}
                                </p>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2">
                                  <div className="h-2 w-2 rounded-full bg-primary" />
                                  <span className="text-sm font-medium text-primary">Online</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 hover:bg-white/20 text-white"
                                    onClick={() => handleEdit(phone)}
                                  >
                                    <Pencil className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 hover:bg-white/20 text-white"
                                    onClick={() => handleDelete(phone.id)}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                  <Switch
                                    id={`status-${phone.id}`}
                                    checked={phone.online}
                                    onCheckedChange={(checked) => handleBulkStatusChange(checked, [phone])}
                                    className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-muted-foreground/30 dark:data-[state=unchecked]:bg-muted-foreground/20 h-5 w-9"
                                  />
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          )}

          {offlinePhones.length > 0 && (
            <Accordion type="single" collapsible defaultValue="offline">
              <AccordionItem value="offline" className="border-none">
                <div className="flex items-center justify-between">
                  <AccordionTrigger className="p-0 hover:no-underline">
                    <h2 className="text-lg font-medium">Números Offline ({offlinePhones.length})</h2>
                  </AccordionTrigger>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8"
                    onClick={() => handleBulkStatusChange(true, offlinePhones)}
                    disabled={loading}
                  >
                    Ativar Todos
                  </Button>
                </div>
                <AccordionContent className="pt-3">
                  <div className="space-y-1.5">
                    {offlinePhones.map((phone) => (
                      <motion.div
                        key={phone.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        <Card className="shadow-none border-0 bg-muted hover:bg-muted/60 transition-colors">
                          <CardContent className="px-4 py-2">
                            <div className="flex items-center justify-between">
                              <div className="space-y-1">
                                <p className="text-lg font-medium text-foreground">
                                  {phone.number}
                                </p>
                                <h3 className="text-sm text-muted-foreground">
                                  {phone.name || 'Sem nome'}
                                </h3>
                                <p className="text-xs text-muted-foreground">
                                  Offline {formatLastOnline(phone.lastOnlineChange)}
                                </p>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2">
                                  <div className="h-2 w-2 rounded-full bg-muted-foreground/50" />
                                  <span className="text-sm font-medium text-muted-foreground">Offline</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 hover:bg-white/20 text-white"
                                    onClick={() => handleEdit(phone)}
                                  >
                                    <Pencil className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 hover:bg-white/20 text-white"
                                    onClick={() => handleDelete(phone.id)}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                  <Switch
                                    id={`status-${phone.id}`}
                                    checked={phone.online}
                                    onCheckedChange={(checked) => handleBulkStatusChange(checked, [phone])}
                                    className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-muted-foreground/30 dark:data-[state=unchecked]:bg-muted-foreground/20 h-5 w-9"
                                  />
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          )}

          {phones.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <p className="text-muted-foreground text-lg">Nenhum número registrado</p>
              <Button
                onClick={() => setIsDialogOpen(true)}
                variant="outline"
                className="mt-6"
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar número
              </Button>
            </motion.div>
          )}
        </div>
      </main>

      <Dialog 
        open={isDialogOpen} 
        onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setTimeout(() => {
              setEditingPhone(null);
              setNewPhone({ number: '', name: '' });
            }, 150);
          }
        }}
      >
        <DialogContent className="sm:max-w-[425px] border-none shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              {editingPhone ? 'Editar número' : 'Adicionar novo número'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">Nome</Label>
                <Input
                  id="name"
                  value={newPhone.name}
                  onChange={(e) => setNewPhone({ ...newPhone, name: e.target.value })}
                  placeholder="Ex: João Silva"
                  className="h-10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="number" className="text-sm font-medium">Número</Label>
                <Input
                  id="number"
                  value={newPhone.number}
                  onChange={(e) => setNewPhone({ ...newPhone, number: e.target.value })}
                  placeholder="Ex: 77999999999"
                  required
                  className="h-10"
                />
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button 
                variant="outline" 
                type="button" 
                onClick={() => {
                  setIsDialogOpen(false);
                }}
                className="h-10"
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={loading}
                className="h-10"
              >
                {loading ? 'Salvando...' : editingPhone ? 'Salvar' : 'Adicionar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}