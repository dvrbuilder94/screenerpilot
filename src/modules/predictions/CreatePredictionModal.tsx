import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { useCreatePrediction } from './hooks/usePredictions';
import type { PredictionCondition } from './types';

interface CreatePredictionModalProps {
  seasonId: string;
}

export function CreatePredictionModal({ seasonId }: CreatePredictionModalProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [symbol, setSymbol] = useState('');
  const [conditionType, setConditionType] = useState<PredictionCondition['type']>('price_above');
  const [target, setTarget] = useState('');
  const [resolveAt, setResolveAt] = useState('');

  const createMutation = useCreatePrediction();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const condition: PredictionCondition = {
      type: conditionType,
      target: parseFloat(target),
    };

    createMutation.mutate(
      {
        season_id: seasonId,
        title,
        symbol: symbol.toUpperCase(),
        condition,
        resolve_at: new Date(resolveAt).toISOString(),
      },
      {
        onSuccess: () => {
          setOpen(false);
          setTitle('');
          setSymbol('');
          setTarget('');
          setResolveAt('');
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Prediction
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Prediction</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="Will BTC reach $100,000?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="symbol">Symbol</Label>
            <Input
              id="symbol"
              placeholder="BTCUSDT"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Condition Type</Label>
            <Select value={conditionType} onValueChange={(v) => setConditionType(v as PredictionCondition['type'])}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="price_above">Price Above</SelectItem>
                <SelectItem value="price_below">Price Below</SelectItem>
                <SelectItem value="price_change_percent">Price Change %</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="target">Target Value</Label>
            <Input
              id="target"
              type="number"
              step="any"
              placeholder={conditionType === 'price_change_percent' ? '10' : '100000'}
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="resolveAt">Resolution Date/Time</Label>
            <Input
              id="resolveAt"
              type="datetime-local"
              value={resolveAt}
              onChange={(e) => setResolveAt(e.target.value)}
              required
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Creating...' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
