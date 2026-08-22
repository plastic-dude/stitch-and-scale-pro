import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Building2, Calendar, Pencil, Trash2, CheckCircle2, Truck, Receipt, Clock, Ban } from 'lucide-react';
import { type PatternProject, type WholesaleOrder, type WholesaleOrderStatus, generateId } from '@/lib/grading-engine';
import { useSettings } from '@/context/SettingsContext';
import { COLLABORATION_COPY } from '@/lib/collaboration-copy';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface WholesaleFollowUpCardProps {
  project: PatternProject;
  addWholesaleOrder: (order: WholesaleOrder) => void;
  updateWholesaleOrder: (orderId: string, patch: Partial<WholesaleOrder>) => void;
  deleteWholesaleOrder: (orderId: string) => void;
}

export function WholesaleFollowUpCard({ project, addWholesaleOrder, updateWholesaleOrder, deleteWholesaleOrder }: WholesaleFollowUpCardProps) {
  const { language } = useSettings();
  const copy = COLLABORATION_COPY[language];
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<WholesaleOrder | null>(null);

  const [formData, setFormData] = useState<Partial<WholesaleOrder>>({
    account: '',
    orderId: '',
    invoiceId: '',
    terms: '',
    dueDate: '',
    status: 'planned',
    paymentFollowUp: '',
    notes: '',
  });

  const handleSave = () => {
    if (!formData.account) {
      toast.error(copy.nameLabel + ' is required');
      return;
    }

    const now = new Date().toISOString();
    if (editingOrder) {
      updateWholesaleOrder(editingOrder.id, {
        ...formData,
        updatedAt: now,
      });
      toast.success(copy.wholesaleOrderUpdated);
    } else {
      addWholesaleOrder({
        ...formData as WholesaleOrder,
        id: generateId(),
        createdAt: now,
        updatedAt: now,
      });
      toast.success(copy.wholesaleOrderUpdated);
    }
    setIsAddOpen(false);
    setEditingOrder(null);
    setFormData({
      account: '',
      orderId: '',
      invoiceId: '',
      terms: '',
      dueDate: '',
      status: 'planned',
      paymentFollowUp: '',
      notes: '',
    });
  };

  const getStatusIcon = (status: WholesaleOrderStatus) => {
    switch (status) {
      case 'planned': return <Clock className="h-4 w-4 text-slate-400" />;
      case 'invoiced': return <Receipt className="h-4 w-4 text-blue-500" />;
      case 'shipped': return <Truck className="h-4 w-4 text-orange-500" />;
      case 'paid': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'cancelled': return <Ban className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusLabel = (status: WholesaleOrderStatus) => {
    switch (status) {
      case 'planned': return copy.planned;
      case 'invoiced': return copy.invoiced;
      case 'shipped': return copy.shipped;
      case 'paid': return copy.paid;
      case 'cancelled': return copy.cancelled;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <Building2 className="h-5 w-5 text-indigo-500" />
            {copy.wholesaleFollowUp}
          </CardTitle>
          <CardDescription>
            {copy.noWholesaleOrders}
          </CardDescription>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2" onClick={() => {
              setEditingOrder(null);
              setFormData({ account: '', orderId: '', invoiceId: '', terms: '', dueDate: '', status: 'planned', paymentFollowUp: '', notes: '' });
            }}>
              <Plus className="h-4 w-4" />
              {copy.addWholesaleOrder}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{editingOrder ? copy.editWholesaleOrder : copy.addWholesaleOrder}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="account">{copy.accountLabel}</Label>
                <Input
                  id="account"
                  value={formData.account}
                  onChange={(e) => setFormData({ ...formData, account: e.target.value })}
                  placeholder="Local Yarn Shop"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="orderId">{copy.orderIdLabel}</Label>
                  <Input
                    id="orderId"
                    value={formData.orderId}
                    onChange={(e) => setFormData({ ...formData, orderId: e.target.value })}
                    placeholder="ORD-001"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="invoiceId">{copy.invoiceIdLabel}</Label>
                  <Input
                    id="invoiceId"
                    value={formData.invoiceId}
                    onChange={(e) => setFormData({ ...formData, invoiceId: e.target.value })}
                    placeholder="INV-001"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="dueDate">{copy.dueDateLabel}</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="status">{copy.statusLabel}</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: WholesaleOrderStatus) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="planned">{copy.planned}</SelectItem>
                      <SelectItem value="invoiced">{copy.invoiced}</SelectItem>
                      <SelectItem value="shipped">{copy.shipped}</SelectItem>
                      <SelectItem value="paid">{copy.paid}</SelectItem>
                      <SelectItem value="cancelled">{copy.cancelled}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="terms">{copy.termsLabel}</Label>
                <Input
                  id="terms"
                  value={formData.terms}
                  onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
                  placeholder="Net 30"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="paymentFollowUp">{copy.paymentFollowUpLabel}</Label>
                <Input
                  id="paymentFollowUp"
                  value={formData.paymentFollowUp}
                  onChange={(e) => setFormData({ ...formData, paymentFollowUp: e.target.value })}
                  placeholder="Follow up on 2026-09-01"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="notes">{copy.notesLabel}</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddOpen(false)}>{copy.cancel}</Button>
              <Button onClick={handleSave}>{copy.inviteButton}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 mt-4">
          {!project.wholesaleOrders || project.wholesaleOrders.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed rounded-lg text-slate-500">
              {copy.noWholesaleOrders}
            </div>
          ) : (
            project.wholesaleOrders.map((order) => (
              <div key={order.id} className="flex items-start justify-between p-4 border rounded-lg bg-slate-50/50">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-slate-900">{order.account}</h4>
                    <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-white border shadow-sm">
                      {getStatusIcon(order.status)}
                      {getStatusLabel(order.status)}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
                    {order.orderId && <span>{copy.orderIdLabel}: {order.orderId}</span>}
                    {order.invoiceId && <span>{copy.invoiceIdLabel}: {order.invoiceId}</span>}
                    {order.dueDate && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {copy.dueDateLabel}: {order.dueDate}
                      </span>
                    )}
                  </div>
                  {order.terms && <p className="text-sm text-slate-600 italic">{copy.termsLabel}: {order.terms}</p>}
                  {order.paymentFollowUp && <p className="text-sm text-amber-600 font-medium">{copy.paymentFollowUpLabel}: {order.paymentFollowUp}</p>}
                  {order.notes && <p className="text-sm text-slate-600 mt-2">{order.notes}</p>}
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                    setEditingOrder(order);
                    setFormData(order);
                    setIsAddOpen(true);
                  }}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600" onClick={() => {
                    if (confirm(copy.deleteWholesaleOrderConfirm)) {
                      deleteWholesaleOrder(order.id);
                    }
                  }}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
