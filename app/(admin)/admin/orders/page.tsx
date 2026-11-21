"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Loader2 } from "lucide-react"
import { formatBusinessDateTime } from "@/lib/date-time"

type Order = {
  id: string
  customerName: string
  customerPhone: string
  address: string
  status: string
  estimatedTotal: number
  createdAt: string
  _count: { items: number }
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ status: statusFilter })
    if (search.trim()) params.set("search", search.trim())
    const res = await fetch(`/api/admin/orders?${params.toString()}`)
    if (res.ok) {
      const data = await res.json()
      setOrders(data)
    }
    setLoading(false)
  }, [statusFilter, search])

  // Загружаем при монтировании и при изменении фильтров (с задержкой для поиска)
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchOrders()
    }, 300)
    return () => clearTimeout(timer)
  }, [fetchOrders])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "NEW": return <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-xs font-medium">Новая</span>
      case "AGREED": return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-md text-xs font-medium">Согласована</span>
      case "COMPLETED": return <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-xs font-medium">Завершена</span>
      case "CANCELLED": return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-md text-xs font-medium">Отменена</span>
      default: return status
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Заявки</h1>
      </div>

      {/* Фильтры */}
      <div className="flex flex-col sm:flex-row gap-4 bg-card p-4 rounded-xl border">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Поиск по имени, телефону или адресу..." 
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0">
          {["ALL", "NEW", "AGREED", "COMPLETED", "CANCELLED"].map((status) => (
            <Button
              key={status}
              variant={statusFilter === status ? "default" : "outline"}
              onClick={() => setStatusFilter(status)}
              className="whitespace-nowrap"
            >
              {status === "ALL" && "Все"}
              {status === "NEW" && "Новые"}
              {status === "AGREED" && "Согласованные"}
              {status === "COMPLETED" && "Завершенные"}
              {status === "CANCELLED" && "Отмененные"}
            </Button>
          ))}
        </div>
      </div>

      {/* Таблица */}
      <div className="bg-card border rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">Заявок не найдено</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-secondary/50 text-muted-foreground border-b">
                <tr>
                  <th className="px-4 py-3 font-medium">Дата</th>
                  <th className="px-4 py-3 font-medium">Клиент</th>
                  <th className="px-4 py-3 font-medium">Телефон</th>
                  <th className="px-4 py-3 font-medium">Сумма</th>
                  <th className="px-4 py-3 font-medium">Статус</th>
                  <th className="px-4 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-secondary/20 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap">
                      {formatBusinessDateTime(order.createdAt, {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-4 py-3 font-medium">
                      {order.customerName}
                      <div className="text-xs text-muted-foreground font-normal">{order._count.items} поз.</div>
                    </td>
                    <td className="px-4 py-3">{order.customerPhone}</td>
                    <td className="px-4 py-3 font-medium">{(order.estimatedTotal / 100).toLocaleString('ru-RU')} ₽</td>
                    <td className="px-4 py-3">{getStatusBadge(order.status)}</td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/admin/orders/${order.id}`}>
                        <Button variant="outline" size="sm">Открыть</Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
