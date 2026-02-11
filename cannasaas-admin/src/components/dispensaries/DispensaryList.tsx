import { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import api from '@/lib/api';
import { Plus, Edit, Trash2 } from 'lucide-react';

interface Dispensary {
  id: string;
  name: string;
  streetAddress: string;
  city: string;
  state: string;
  phoneNumber: string;
  isActive: boolean;
}

export function DispensaryList() {
  const [dispensaries, setDispensaries] = useState<Dispensary[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchDispensaries();
  }, []);

  const fetchDispensaries = async () => {
    try {
      const response = await api.get('/dispensaries');
      setDispensaries(response.data);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to load dispensaries',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this dispensary?')) {
      return;
    }

    try {
      await api.delete(`/dispensaries/${id}`);
      toast({
        title: 'Success',
        description: 'Dispensary deleted successfully',
      });
      fetchDispensaries();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to delete dispensary',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className='space-y-4'>
      <div className='flex justify-between items-center'>
        <h2 className='text-2xl font-bold'>Dispensaries</h2>
        <Button>
          <Plus className='mr-2 h-4 w-4' />
          Add Dispensary
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Address</TableHead>
            <TableHead>City</TableHead>
            <TableHead>State</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {dispensaries.map((dispensary) => (
            <TableRow key={dispensary.id}>
              <TableCell className='font-medium'>{dispensary.name}</TableCell>
              <TableCell>{dispensary.streetAddress}</TableCell>
              <TableCell>{dispensary.city}</TableCell>
              <TableCell>{dispensary.state}</TableCell>
              <TableCell>{dispensary.phoneNumber}</TableCell>
              <TableCell>
                <Badge variant={dispensary.isActive ? 'default' : 'secondary'}>
                  {dispensary.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </TableCell>
              <TableCell>
                <div className='flex gap-2'>
                  <Button variant='ghost' size='sm'>
                    <Edit className='h-4 w-4' />
                  </Button>
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={() => handleDelete(dispensary.id)}
                  >
                    <Trash2 className='h-4 w-4 text-red-500' />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
