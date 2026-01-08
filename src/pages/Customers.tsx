import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  Filter,
  Download,
  ChevronLeft,
  ChevronRight,
  Eye,
  ArrowUpDown,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

// Sample data
const customers = Array.from({ length: 50 }, (_, i) => ({
  id: `CUST-${String(i + 1).padStart(3, '0')}`,
  tenure: Math.floor(Math.random() * 72) + 1,
  monthly_charges: parseFloat((Math.random() * 100 + 20).toFixed(2)),
  contract_type: ['Month-to-month', 'One year', 'Two year'][Math.floor(Math.random() * 3)],
  payment_method: ['Electronic check', 'Mailed check', 'Bank transfer', 'Credit card'][Math.floor(Math.random() * 4)],
  internet_service: ['DSL', 'Fiber optic', 'No'][Math.floor(Math.random() * 3)],
  tech_support: Math.random() > 0.5,
  churn_status: Math.random() > 0.8,
}));

export default function Customers() {
  const [search, setSearch] = useState('');
  const [contractFilter, setContractFilter] = useState('all');
  const [churnFilter, setChurnFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedCustomer, setSelectedCustomer] = useState<typeof customers[0] | null>(null);
  const pageSize = 10;

  const filteredCustomers = useMemo(() => {
    let result = customers.filter((c) => {
      const matchesSearch = c.id.toLowerCase().includes(search.toLowerCase());
      const matchesContract = contractFilter === 'all' || c.contract_type === contractFilter;
      const matchesChurn = churnFilter === 'all' || 
        (churnFilter === 'churned' && c.churn_status) ||
        (churnFilter === 'active' && !c.churn_status);
      return matchesSearch && matchesContract && matchesChurn;
    });

    if (sortField) {
      result = [...result].sort((a, b) => {
        const aVal = a[sortField as keyof typeof a];
        const bVal = b[sortField as keyof typeof b];
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
        }
        return sortDirection === 'asc'
          ? String(aVal).localeCompare(String(bVal))
          : String(bVal).localeCompare(String(aVal));
      });
    }

    return result;
  }, [search, contractFilter, churnFilter, sortField, sortDirection]);

  const paginatedCustomers = filteredCustomers.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.ceil(filteredCustomers.length / pageSize);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const exportToCsv = () => {
    const headers = ['Customer ID', 'Tenure', 'Monthly Charges', 'Contract Type', 'Payment Method', 'Internet Service', 'Tech Support', 'Churn Status'];
    const rows = filteredCustomers.map(c => [
      c.id, c.tenure, c.monthly_charges, c.contract_type, c.payment_method, c.internet_service, c.tech_support ? 'Yes' : 'No', c.churn_status ? 'Churned' : 'Active'
    ]);
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'customers.csv';
    a.click();
  };

  return (
    <DashboardLayout>
      <div className="page-header">
        <h1 className="page-title">Customer Analysis</h1>
        <p className="page-subtitle">Explore and analyze your customer data</p>
      </div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="chart-container mb-6"
      >
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by Customer ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={contractFilter} onValueChange={setContractFilter}>
            <SelectTrigger className="w-[180px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Contract Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Contracts</SelectItem>
              <SelectItem value="Month-to-month">Month-to-month</SelectItem>
              <SelectItem value="One year">One year</SelectItem>
              <SelectItem value="Two year">Two year</SelectItem>
            </SelectContent>
          </Select>

          <Select value={churnFilter} onValueChange={setChurnFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="churned">Churned</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={exportToCsv} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="chart-container"
      >
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>
                  <button onClick={() => handleSort('id')} className="flex items-center gap-1 hover:text-foreground">
                    Customer ID <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th>
                  <button onClick={() => handleSort('tenure')} className="flex items-center gap-1 hover:text-foreground">
                    Tenure (months) <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th>
                  <button onClick={() => handleSort('monthly_charges')} className="flex items-center gap-1 hover:text-foreground">
                    Monthly Charges <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th>Contract Type</th>
                <th>Tech Support</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedCustomers.map((customer, index) => (
                <motion.tr
                  key={customer.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.03 }}
                >
                  <td><span className="font-mono text-sm">{customer.id}</span></td>
                  <td>{customer.tenure}</td>
                  <td>${customer.monthly_charges.toFixed(2)}</td>
                  <td>{customer.contract_type}</td>
                  <td>
                    <span className={cn(
                      'px-2 py-0.5 rounded-full text-xs font-medium',
                      customer.tech_support ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'
                    )}>
                      {customer.tech_support ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td>
                    <span className={cn(
                      'risk-badge',
                      customer.churn_status ? 'risk-high' : 'risk-low'
                    )}>
                      {customer.churn_status ? 'Churned' : 'Active'}
                    </span>
                  </td>
                  <td>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedCustomer(customer)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
          <p className="text-sm text-muted-foreground">
            Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, filteredCustomers.length)} of {filteredCustomers.length} customers
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = i + 1;
              return (
                <Button
                  key={pageNum}
                  variant={page === pageNum ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPage(pageNum)}
                >
                  {pageNum}
                </Button>
              );
            })}
            <Button
              variant="outline"
              size="sm"
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Customer Detail Modal */}
      <Dialog open={!!selectedCustomer} onOpenChange={() => setSelectedCustomer(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Customer Details</DialogTitle>
          </DialogHeader>
          {selectedCustomer && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Customer ID</p>
                  <p className="font-mono font-medium">{selectedCustomer.id}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <span className={cn(
                    'risk-badge',
                    selectedCustomer.churn_status ? 'risk-high' : 'risk-low'
                  )}>
                    {selectedCustomer.churn_status ? 'Churned' : 'Active'}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tenure</p>
                  <p className="font-medium">{selectedCustomer.tenure} months</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Monthly Charges</p>
                  <p className="font-medium">${selectedCustomer.monthly_charges.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Contract Type</p>
                  <p className="font-medium">{selectedCustomer.contract_type}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Payment Method</p>
                  <p className="font-medium">{selectedCustomer.payment_method}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Internet Service</p>
                  <p className="font-medium">{selectedCustomer.internet_service}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tech Support</p>
                  <p className="font-medium">{selectedCustomer.tech_support ? 'Yes' : 'No'}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
