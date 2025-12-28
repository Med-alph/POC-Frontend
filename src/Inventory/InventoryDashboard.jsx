import { useEffect, useState } from 'react';
import { useInventory } from '../contexts/InventoryContext';
import { Package, AlertTriangle, TrendingUp, DollarSign, Plus, ArrowUpCircle, ArrowDownCircle, Calendar, Clock, Upload } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import StockTransactionModal from './components/StockTransactionModal';
import StockInWithBatchModal from './components/StockInWithBatchModal';
import StockOutFEFOModal from './components/StockOutFEFOModal';
import BulkImportModal from './components/BulkImportModal';
import inventoryAPI from '../api/inventoryapi';

export default function InventoryDashboard() {
  const { dashboard, loadDashboard, items, loadItems } = useInventory();
  const [showStockModal, setShowStockModal] = useState(false);
  const [showBatchStockInModal, setShowBatchStockInModal] = useState(false);
  const [showBatchStockOutModal, setShowBatchStockOutModal] = useState(false);
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [transactionType, setTransactionType] = useState('IN');
  const [expiryAlerts, setExpiryAlerts] = useState({ expired: [], expiring_soon: [], summary: {} });

  useEffect(() => {
    loadDashboard();
    loadItems();
    loadExpiryAlerts();
  }, []);

  const loadExpiryAlerts = async () => {
    try {
      const response = await inventoryAPI.getExpiryAlerts(30);
      console.log('Expiry alerts response:', response.data);
      setExpiryAlerts(response.data || { expired: [], expiring_soon: [], summary: {} });
    } catch (err) {
      console.error('Error loading expiry alerts:', err);
    }
  };

  const handleStockAction = (item, type) => {
    setSelectedItem(item);
    setTransactionType(type);
    
    // Use batch-enabled modals for stock operations
    if (type === 'IN') {
      setShowBatchStockInModal(true);
    } else if (type === 'OUT') {
      setShowBatchStockOutModal(true);
    } else {
      // Fallback to old modal for other types
      setShowStockModal(true);
    }
  };

  const handleStockSuccess = () => {
    loadDashboard();
    loadItems();
    loadExpiryAlerts();
  };

  const handleBulkImportSuccess = () => {
    loadDashboard();
    loadItems();
    loadExpiryAlerts();
    setShowBulkImportModal(false);
  };

  const lowStockItems = items.filter(item => item.is_low_stock && item.is_active);
  const recentTransactions = dashboard.recent_transactions || [];
  
  // Calculate today's transactions from recent transactions
  const todaysTransactions = recentTransactions.filter(transaction => {
    const transactionDate = new Date(transaction.created_at);
    const today = new Date();
    return transactionDate.toDateString() === today.toDateString();
  }).length;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard.total_items || 0}</div>
            <p className="text-xs text-muted-foreground">
              Active inventory items
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{dashboard.low_stock_count || 0}</div>
            <p className="text-xs text-muted-foreground">
              Items below reorder level
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Stock Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{dashboard.total_stock_value || 0}</div>
            <p className="text-xs text-muted-foreground">
              Current inventory value
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Transactions</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todaysTransactions}</div>
            <p className="text-xs text-muted-foreground">
              Stock movements today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expired Items</CardTitle>
            <Clock className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{expiryAlerts.summary?.expired_count || 0}</div>
            <p className="text-xs text-muted-foreground">
              Items past expiry date
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
            <Calendar className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{expiryAlerts.summary?.expiring_soon_count || 0}</div>
            <p className="text-xs text-muted-foreground">
              Items expiring in 30 days
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button 
              onClick={() => window.location.href = '/inventory/items?action=add'}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add New Item
            </Button>
            <Button 
              onClick={() => setShowBulkImportModal(true)}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              Bulk Import
            </Button>
            <Button 
              variant="outline"
              onClick={() => window.location.href = '/inventory/transactions'}
              className="flex items-center gap-2"
            >
              <ArrowUpCircle className="h-4 w-4" />
              Stock In
            </Button>
            <Button 
              variant="outline"
              onClick={() => window.location.href = '/inventory/transactions'}
              className="flex items-center gap-2"
            >
              <ArrowDownCircle className="h-4 w-4" />
              Stock Out
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Low Stock Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Low Stock Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {lowStockItems.length === 0 ? (
              <p className="text-sm text-muted-foreground">No low stock items</p>
            ) : (
              <div className="space-y-3">
                {lowStockItems.slice(0, 5).map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                    <div>
                      <p className="font-medium text-sm">{item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Current: {item.current_stock} {item.unit} | Reorder: {item.reorder_level}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleStockAction(item, 'IN')}
                        className="h-8 px-3"
                      >
                        Stock In
                      </Button>
                    </div>
                  </div>
                ))}
                {lowStockItems.length > 5 && (
                  <Button 
                    variant="link" 
                    className="w-full"
                    onClick={() => window.location.href = '/inventory/items?filter=low_stock'}
                  >
                    View all {lowStockItems.length} low stock items
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Expiry Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-red-500" />
              Expiry Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(expiryAlerts.expired?.length || 0) + (expiryAlerts.expiring_soon?.length || 0) === 0 ? (
              <p className="text-sm text-muted-foreground">No expiry alerts</p>
            ) : (
              <div className="space-y-3">
                {/* Expired Items */}
                {expiryAlerts.expired?.slice(0, 3).map((alert, index) => (
                  <div key={`expired-${index}`} className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                    <div>
                      <p className="font-medium text-sm">{alert.item?.name || alert.item_name || 'Unknown Item'}</p>
                      <p className="text-xs text-muted-foreground">
                        Batch: {alert.batch_number} | Qty: {alert.current_quantity}
                      </p>
                      <p className="text-xs text-red-600">🔴 Expired</p>
                    </div>
                  </div>
                ))}
                
                {/* Expiring Soon Items */}
                {expiryAlerts.expiring_soon?.slice(0, 2).map((alert, index) => (
                  <div key={`expiring-${index}`} className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                    <div>
                      <p className="font-medium text-sm">{alert.item?.name || alert.item_name || 'Unknown Item'}</p>
                      <p className="text-xs text-muted-foreground">
                        Batch: {alert.batch_number} | Qty: {alert.current_quantity}
                      </p>
                      <p className="text-xs text-orange-600">🟠 Expiring in {alert.days_to_expiry} days</p>
                    </div>
                  </div>
                ))}
                
                {/* <Button 
                  variant="link" 
                  className="w-full"
                  onClick={() => window.location.href = '/inventory/expiry-alerts'}
                >
                  View all expiry alerts
                </Button> */}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            {recentTransactions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recent transactions</p>
            ) : (
              <div className="space-y-3">
                {recentTransactions.slice(0, 5).map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${
                        transaction.transaction_type === 'IN' 
                          ? 'bg-green-100 dark:bg-green-900/20' 
                          : 'bg-red-100 dark:bg-red-900/20'
                      }`}>
                        {transaction.transaction_type === 'IN' ? (
                          <ArrowUpCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <ArrowDownCircle className="h-4 w-4 text-red-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{transaction.item?.name || 'Unknown Item'}</p>
                        <p className="text-xs text-muted-foreground">
                          {transaction.transaction_type} {transaction.quantity} {transaction.item?.unit || ''}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">
                        {new Date(transaction.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
                <Button 
                  variant="link" 
                  className="w-full"
                  onClick={() => window.location.href = '/inventory/transactions'}
                >
                  View all transactions
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Stock Transaction Modals */}
      {showStockModal && (
        <StockTransactionModal
          isOpen={showStockModal}
          onClose={() => setShowStockModal(false)}
          item={selectedItem}
          type={transactionType}
        />
      )}

      {showBatchStockInModal && (
        <StockInWithBatchModal
          isOpen={showBatchStockInModal}
          onClose={() => setShowBatchStockInModal(false)}
          item={selectedItem}
          onSuccess={handleStockSuccess}
        />
      )}

      {showBatchStockOutModal && (
        <StockOutFEFOModal
          isOpen={showBatchStockOutModal}
          onClose={() => setShowBatchStockOutModal(false)}
          item={selectedItem}
          onSuccess={handleStockSuccess}
        />
      )}

      {/* Bulk Import Modal */}
      {showBulkImportModal && (
        <BulkImportModal
          isOpen={showBulkImportModal}
          onClose={() => setShowBulkImportModal(false)}
          onSuccess={handleBulkImportSuccess}
        />
      )}
    </div>
  );
}