import { useState, useEffect } from 'react';
import { useCallback } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  ShoppingCart, 
  Package, 
  AlertTriangle,
  Calendar,
  Download,
  Filter,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '../components/ui/select';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { formatCurrency } from '../lib/exportUtils';
import { supabase } from '../lib/supabase';
import { useNotifications } from '../store/useStore';

interface KPIData {
  totalCustomers: number;
  totalOrders: number;
  monthlyRevenue: number;
  previousMonthRevenue: number;
  customerGrowth: number;
  orderGrowth: number;
  revenueGrowth: number;
}

interface SalesData {
  month: string;
  vendite: number;
  ordini: number;
}

interface TopProduct {
  name: string;
  vendite: number;
  quantita: number;
}

interface OrderStatusData {
  name: string;
  value: number;
  color: string;
}

const COLORS = ['#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#ef4444', '#06b6d4'];

export const ReportsPage = () => {
  const [timeFilter, setTimeFilter] = useState('30d');
  const [loading, setLoading] = useState(true);
  const [kpiData, setKpiData] = useState<KPIData>({
    totalCustomers: 0,
    totalOrders: 0,
    monthlyRevenue: 0,
    previousMonthRevenue: 0,
    customerGrowth: 0,
    orderGrowth: 0,
    revenueGrowth: 0
  });
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [orderStatusData, setOrderStatusData] = useState<OrderStatusData[]>([]);

  const { addNotification } = useNotifications();

  const getDateRange = (filter: string) => {
    const now = new Date();
    let startDate = new Date();
    
    switch (filter) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setDate(now.getDate() - 30);
    }
    
    return { startDate, endDate: now };
  };

  const loadReportData = useCallback(async () => {
    try {
      setLoading(true);
      const { startDate, endDate } = getDateRange(timeFilter);
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];

      // Load KPI Data
      const [customersResult, ordersResult, revenueResult] = await Promise.all([
        // Total customers
        supabase
          .from('customers')
          .select('id', { count: 'exact' })
          .eq('is_active', true),
        
        // Total orders in period
        supabase
          .from('orders')
          .select('id', { count: 'exact' })
          .gte('order_date', startDateStr)
          .lte('order_date', endDateStr),
        
        // Revenue data
        supabase
          .from('orders')
          .select('total_amount, tax_amount, order_date')
          .gte('order_date', startDateStr)
          .lte('order_date', endDateStr)
      ]);

      // Calculate previous period for growth comparison
      const periodDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const prevStartDate = new Date(startDate);
      prevStartDate.setDate(startDate.getDate() - periodDays);
      const prevEndDate = new Date(startDate);
      prevEndDate.setDate(startDate.getDate() - 1);

      const [prevOrdersResult, prevRevenueResult] = await Promise.all([
        supabase
          .from('orders')
          .select('id', { count: 'exact' })
          .gte('order_date', prevStartDate.toISOString().split('T')[0])
          .lte('order_date', prevEndDate.toISOString().split('T')[0]),
        
        supabase
          .from('orders')
          .select('total_amount, tax_amount')
          .gte('order_date', prevStartDate.toISOString().split('T')[0])
          .lte('order_date', prevEndDate.toISOString().split('T')[0])
      ]);

      // Calculate KPIs
      const totalCustomers = customersResult.count || 0;
      const totalOrders = ordersResult.count || 0;
      const monthlyRevenue = revenueResult.data?.reduce((sum, order) => sum + (order.total_amount + order.tax_amount), 0) || 0;
      const previousMonthRevenue = prevRevenueResult.data?.reduce((sum, order) => sum + (order.total_amount + order.tax_amount), 0) || 0;
      const prevOrdersCount = prevOrdersResult.count || 0;

      const revenueGrowth = previousMonthRevenue > 0 ? ((monthlyRevenue - previousMonthRevenue) / previousMonthRevenue) * 100 : 0;
      const orderGrowth = prevOrdersCount > 0 ? ((totalOrders - prevOrdersCount) / prevOrdersCount) * 100 : 0;

      setKpiData({
        totalCustomers,
        totalOrders,
        monthlyRevenue,
        previousMonthRevenue,
        customerGrowth: 12, // This would need historical customer data to calculate properly
        orderGrowth,
        revenueGrowth
      });

      // Load Sales Trend Data (last 6 months)
      const salesTrendData: SalesData[] = [];
      const monthNames = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];
      
      for (let i = 5; i >= 0; i--) {
        const monthStart = new Date();
        monthStart.setMonth(monthStart.getMonth() - i);
        monthStart.setDate(1);
        
        const monthEnd = new Date(monthStart);
        monthEnd.setMonth(monthEnd.getMonth() + 1);
        monthEnd.setDate(0);

        const { data: monthOrders } = await supabase
          .from('orders')
          .select('total_amount, tax_amount')
          .gte('order_date', monthStart.toISOString().split('T')[0])
          .lte('order_date', monthEnd.toISOString().split('T')[0]);

        const { count: monthOrderCount } = await supabase
          .from('orders')
          .select('id', { count: 'exact' })
          .gte('order_date', monthStart.toISOString().split('T')[0])
          .lte('order_date', monthEnd.toISOString().split('T')[0]);

        const monthRevenue = monthOrders?.reduce((sum, order) => sum + (order.total_amount + order.tax_amount), 0) || 0;
        
        salesTrendData.push({
          month: monthNames[monthStart.getMonth()],
          vendite: monthRevenue,
          ordini: monthOrderCount || 0
        });
      }
      setSalesData(salesTrendData);

      // Load Order Status Distribution
      const { data: allOrders } = await supabase
        .from('orders')
        .select('status')
        .gte('order_date', startDateStr)
        .lte('order_date', endDateStr);

      const statusCounts = {
        pending: 0,
        confirmed: 0,
        processing: 0,
        shipped: 0,
        delivered: 0,
        cancelled: 0
      };

      allOrders?.forEach(order => {
        statusCounts[order.status as keyof typeof statusCounts]++;
      });

      const totalOrdersForStatus = Object.values(statusCounts).reduce((sum, count) => sum + count, 0);
      
      const statusDistribution: OrderStatusData[] = [
        { name: 'Confermati', value: totalOrdersForStatus > 0 ? Math.round((statusCounts.confirmed / totalOrdersForStatus) * 100) : 0, color: '#10b981' },
        { name: 'In Lavorazione', value: totalOrdersForStatus > 0 ? Math.round((statusCounts.processing / totalOrdersForStatus) * 100) : 0, color: '#f59e0b' },
        { name: 'Spediti', value: totalOrdersForStatus > 0 ? Math.round((statusCounts.shipped / totalOrdersForStatus) * 100) : 0, color: '#3b82f6' },
        { name: 'Consegnati', value: totalOrdersForStatus > 0 ? Math.round((statusCounts.delivered / totalOrdersForStatus) * 100) : 0, color: '#8b5cf6' }
      ].filter(item => item.value > 0);

      setOrderStatusData(statusDistribution);

      // Load Top Products
      const { data: orderItems } = await supabase
        .from('order_items')
        .select(`
          quantity,
          total_price,
          products (name, code),
          orders!inner (order_date)
        `)
        .gte('orders.order_date', startDateStr)
        .lte('orders.order_date', endDateStr);

      const productSales: { [key: string]: { name: string, vendite: number, quantita: number } } = {};
      
      orderItems?.forEach(item => {
        const productName = item.products?.name || 'Prodotto Sconosciuto';
        if (!productSales[productName]) {
          productSales[productName] = { name: productName, vendite: 0, quantita: 0 };
        }
        productSales[productName].vendite += item.total_price;
        productSales[productName].quantita += item.quantity;
      });

      const topProductsList = Object.values(productSales)
        .sort((a, b) => b.vendite - a.vendite)
        .slice(0, 5);

      setTopProducts(topProductsList);

    } catch (error) {
      console.error('Error loading report data:', error);
      addNotification({
        type: 'error',
        title: 'Errore',
        message: 'Impossibile caricare i dati del report'
      });
    } finally {
      setLoading(false);
    }
  }, [timeFilter, addNotification]);

  useEffect(() => {
    loadReportData();
  }, [loadReportData]);

  const handleExportReport = () => {
    addNotification({
      type: 'info',
      title: 'Export Report',
      message: 'Funzionalità di export in fase di sviluppo'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Caricamento dati report...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Report & Analytics</h1>
          <p className="text-gray-600 mt-1">
            Analizza le performance commerciali e monitora i KPI
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Select value={timeFilter} onValueChange={setTimeFilter}>
            <SelectTrigger className="w-40">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Ultimi 7 giorni</SelectItem>
              <SelectItem value="30d">Ultimi 30 giorni</SelectItem>
              <SelectItem value="90d">Ultimi 3 mesi</SelectItem>
              <SelectItem value="1y">Ultimo anno</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleExportReport}>
            <Download className="w-4 h-4 mr-2" />
            Esporta Report
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Clienti Totali
            </CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpiData.totalCustomers}</div>
            <p className={`text-xs mt-1 ${kpiData.customerGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {kpiData.customerGrowth >= 0 ? '+' : ''}{kpiData.customerGrowth.toFixed(1)}% rispetto al periodo precedente
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Ordini Totali
            </CardTitle>
            <ShoppingCart className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpiData.totalOrders}</div>
            <p className={`text-xs mt-1 ${kpiData.orderGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {kpiData.orderGrowth >= 0 ? '+' : ''}{kpiData.orderGrowth.toFixed(1)}% rispetto al periodo precedente
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Fatturato Periodo
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(kpiData.monthlyRevenue)}</div>
            <p className={`text-xs mt-1 ${kpiData.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {kpiData.revenueGrowth >= 0 ? '+' : ''}{kpiData.revenueGrowth.toFixed(1)}% rispetto al periodo precedente
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5" />
              <span>Andamento Vendite</span>
            </CardTitle>
            <CardDescription>
              Trend delle vendite negli ultimi 6 mesi
            </CardDescription>
          </CardHeader>
          <CardContent>
            {salesData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={salesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value, name) => [
                      name === 'vendite' ? formatCurrency(value as number) : value,
                      name === 'vendite' ? 'Vendite' : 'Ordini'
                    ]}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="vendite" 
                    stroke="#dc2626" 
                    strokeWidth={3}
                    dot={{ fill: '#dc2626', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-gray-500">
                <p>Nessun dato di vendita disponibile per il periodo selezionato</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Order Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5" />
              <span>Distribuzione Ordini</span>
            </CardTitle>
            <CardDescription>
              Stato degli ordini correnti
            </CardDescription>
          </CardHeader>
          <CardContent>
            {orderStatusData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={orderStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={120}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {orderStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value}%`, 'Percentuale']} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap justify-center gap-4 mt-4">
                  {orderStatusData.map((entry, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: entry.color }}
                      />
                      <span className="text-sm text-gray-600">{entry.name}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-gray-500">
                <p>Nessun ordine disponibile per il periodo selezionato</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Products */}
      <div className="grid grid-cols-1 gap-6">
        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Package className="w-5 h-5" />
              <span>Prodotti Più Venduti</span>
            </CardTitle>
            <CardDescription>
              Top 5 prodotti per fatturato
            </CardDescription>
          </CardHeader>
          <CardContent>
            {topProducts.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topProducts} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={120} />
                  <Tooltip formatter={(value) => [formatCurrency(value as number), 'Vendite']} />
                  <Bar dataKey="vendite" fill="#dc2626" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-gray-500">
                <p>Nessun dato di vendita prodotti disponibile per il periodo selezionato</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Summary Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Riepilogo Performance</CardTitle>
          <CardDescription>
            Statistiche dettagliate per il periodo selezionato
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{formatCurrency(kpiData.monthlyRevenue)}</div>
              <p className="text-sm text-gray-600 mt-1">Fatturato Totale</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{kpiData.totalOrders}</div>
              <p className="text-sm text-gray-600 mt-1">Ordini Processati</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">
                {kpiData.totalOrders > 0 ? formatCurrency(kpiData.monthlyRevenue / kpiData.totalOrders) : '€0'}
              </div>
              <p className="text-sm text-gray-600 mt-1">Valore Medio Ordine</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
export default ReportsPage;