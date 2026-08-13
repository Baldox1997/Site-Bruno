"use client";

import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend,
} from "recharts";
import type {
  RevenuePoint, EventRevenue, PaymentSplit, DailySale, SalesInsight,
} from "@/lib/analytics";

const COLORS = ["#C98A3B", "#8E9B7C", "#A9A399", "#6B8E9B"];

function fmt(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const tooltipStyle = {
  background: "#17161e",
  border: "1px solid #2A2826",
  color: "#F3EFE7",
  borderRadius: 4,
  fontSize: 12,
};

function MonthTooltip({ active, payload }: { active?: boolean; payload?: { payload: RevenuePoint }[] }) {
  if (!active || !payload?.[0]) return null;
  const d = payload[0].payload;
  return (
    <div style={tooltipStyle} className="charttip">
      <strong>{d.m}</strong>
      <p>Lucro: {fmt(d.v)}</p>
      <p>{d.pedidos} pedido(s) · {d.fotos} foto(s)</p>
      <p>Ticket médio: {fmt(d.ticket)}</p>
    </div>
  );
}

function EventTooltip({ active, payload }: { active?: boolean; payload?: { payload: EventRevenue }[] }) {
  if (!active || !payload?.[0]) return null;
  const d = payload[0].payload;
  return (
    <div style={tooltipStyle} className="charttip">
      <strong>{d.n}</strong>
      <p>Receita: {fmt(d.v)}</p>
      <p>{d.fotos} foto(s) · {d.pedidos} pedido(s)</p>
    </div>
  );
}

export function SalesInsights({ insights }: { insights: SalesInsight[] }) {
  return (
    <div className="insightgrid">
      {insights.map((ins) => (
        <div key={ins.label} className={`insightcard insightcard--${ins.trend ?? "neutral"}`}>
          <span className="insightcard__label">{ins.label}</span>
          <strong className="insightcard__value">{ins.value}</strong>
          <p className="insightcard__hint">{ins.hint}</p>
        </div>
      ))}
    </div>
  );
}

type Props = {
  byMonth: RevenuePoint[];
  byEvent: EventRevenue[];
  byPayment: PaymentSplit[];
  byDay: DailySale[];
  insights: SalesInsight[];
};

export function AdminDashboardCharts({ byMonth, byEvent, byPayment, byDay, insights }: Props) {
  const hasData = byMonth.some((m) => m.v > 0);

  return (
    <>
      <SalesInsights insights={insights} />

      {!hasData ? (
        <div className="chartcard" style={{ marginTop: 20 }}>
          <p className="page__lead">Nenhuma venda aprovada ainda. Faça um pedido teste no checkout para ver os gráficos preencherem.</p>
        </div>
      ) : (
        <>
          <div className="chartrow">
            <div className="chartcard">
              <h3>Lucro por mês</h3>
              <p className="chartcard__sub">Passe o mouse para ver pedidos, fotos e ticket médio</p>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={byMonth}>
                  <defs>
                    <linearGradient id="gv" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#C98A3B" stopOpacity={0.55} />
                      <stop offset="100%" stopColor="#C98A3B" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#2A2826" vertical={false} />
                  <XAxis dataKey="m" stroke="#A9A399" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#A9A399" fontSize={12} tickLine={false} axisLine={false} width={48} tickFormatter={(v) => `R$${v}`} />
                  <Tooltip content={<MonthTooltip />} />
                  <Area type="monotone" dataKey="v" stroke="#C98A3B" fill="url(#gv)" strokeWidth={2} name="Lucro" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="chartcard">
              <h3>Últimos 14 dias</h3>
              <p className="chartcard__sub">Vendas diárias recentes</p>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={byDay}>
                  <CartesianGrid stroke="#2A2826" vertical={false} />
                  <XAxis dataKey="dia" stroke="#A9A399" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#A9A399" fontSize={11} tickLine={false} axisLine={false} width={44} tickFormatter={(v) => `R$${v}`} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v, name) => [name === "v" ? fmt(Number(v)) : v, name === "v" ? "Receita" : "Pedidos"]} />
                  <Bar dataKey="v" fill="#C98A3B" radius={[3, 3, 0, 0]} name="v" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="chartrow" style={{ marginTop: 18 }}>
            <div className="chartcard">
              <h3>Receita por evento</h3>
              <p className="chartcard__sub">Qual galeria vende mais</p>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={byEvent.length ? byEvent : [{ n: "—", v: 0, fotos: 0, pedidos: 0 }]}>
                  <CartesianGrid stroke="#2A2826" vertical={false} />
                  <XAxis dataKey="n" stroke="#A9A399" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#A9A399" fontSize={12} tickLine={false} axisLine={false} width={48} tickFormatter={(v) => `R$${v}`} />
                  <Tooltip content={<EventTooltip />} />
                  <Bar dataKey="v" fill="#8E9B7C" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="chartcard">
              <h3>Formas de pagamento</h3>
              <p className="chartcard__sub">PIX, cartão e simulado</p>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={byPayment} dataKey="v" nameKey="metodo" cx="50%" cy="45%" outerRadius={72} label={(props) => `${props.name ?? ""}`}>
                    {byPayment.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} formatter={(v, _n, item) => {
                    const p = item?.payload as PaymentSplit;
                    return [`${fmt(Number(v))} · ticket ${fmt(p?.ticket ?? 0)}`, p?.metodo];
                  }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </>
  );
}

export function AdminFinanceChart({ byMonth }: { byMonth: RevenuePoint[] }) {
  const total = byMonth.reduce((s, m) => s + m.v, 0);
  const fotos = byMonth.reduce((s, m) => s + m.fotos, 0);
  return (
    <div className="chartcard" style={{ marginTop: 20 }}>
      <h3>Faturamento — últimos 6 meses</h3>
      <p className="chartcard__sub">{fmt(total)} · {fotos} fotos vendidas no período</p>
      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={byMonth}>
          <CartesianGrid stroke="#2A2826" vertical={false} />
          <XAxis dataKey="m" stroke="#A9A399" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis stroke="#A9A399" fontSize={12} tickLine={false} axisLine={false} width={48} tickFormatter={(v) => `R$${v}`} />
          <Tooltip content={<MonthTooltip />} />
          <Area type="monotone" dataKey="v" stroke="#8E9B7C" fill="#8E9B7C33" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
