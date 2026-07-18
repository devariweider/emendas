import { useMemo, useState } from 'react';
import { useEmendas } from '../emendas/EmendasContext';
import { formatarMoeda } from '../utils/formatacao';
import { meses } from '../data/emendas';
import {
  PieChart, Pie, Cell,
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  LineChart, Line, CartesianGrid,
} from 'recharts';

const CORES = ['#1e40af', '#059669', '#d97706', '#dc2626', '#7c3aed', '#0891b2'];

const graficos = [
  { id: 'pizza', label: 'Pizza' },
  { id: 'barras', label: 'Barras' },
  { id: 'evolucao', label: 'Evolução Mensal' },
  { id: 'radar', label: 'Radar' },
];

export default function GraficosPage() {
  const [graficoAtivo, setGraficoAtivo] = useState('pizza');
  const { emendasComResumo, gastos } = useEmendas();

  const dadosPizza = useMemo(() =>
    emendasComResumo.map((e) => ({ name: e.parlamentar, value: e.totalGasto })).filter((d) => d.value > 0),
  [emendasComResumo]);

  const dadosBarras = useMemo(() =>
    emendasComResumo.map((e) => ({
      name: e.parlamentar,
      valorTotal: e.valorTotal,
      gasto: e.totalGasto,
      saldo: e.saldo,
    })),
  [emendasComResumo]);

  const dadosRadar = useMemo(() => {
    const agrupado = {};
    gastos.forEach((g) => {
      if (!agrupado[g.elementoDespesa]) agrupado[g.elementoDespesa] = 0;
      agrupado[g.elementoDespesa] += Number(g.valorPago) || 0;
    });
    return Object.entries(agrupado).map(([elemento, valor]) => ({
      elemento: elemento.length > 30 ? elemento.slice(0, 27) + '...' : elemento,
      valor,
    }));
  }, [gastos]);

  const dadosEvolucao = useMemo(() => {
    const porMes = {};
    for (let m = 1; m <= 12; m++) {
      porMes[m] = { mes: meses[m - 1].slice(0, 3), acumulado: 0, mensal: 0 };
    }
    gastos.forEach((g) => {
      if (g.data) {
        const m = parseInt(g.data.split('-')[1], 10);
        if (m >= 1 && m <= 12) porMes[m].mensal += Number(g.valorPago) || 0;
      }
    });
    let acumulado = 0;
    return Object.values(porMes).map((d) => {
      acumulado += d.mensal;
      return { ...d, acumulado };
    });
  }, [gastos]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Gráficos</h2>
        <p className="text-sm text-slate-500 mt-1">Visualizações gráficas dos dados de emendas</p>
      </div>

      {/* Seletor */}
      <div className="flex gap-2">
        {graficos.map((g) => (
          <button
            key={g.id}
            onClick={() => setGraficoAtivo(g.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              graficoAtivo === g.id
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {g.label}
          </button>
        ))}
      </div>

      {/* Pizza */}
      {graficoAtivo === 'pizza' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Gastos por Parlamentar</h3>
          {dadosPizza.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <Pie
                  data={dadosPizza}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={140}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${formatarMoeda(value)}`}
                >
                  {dadosPizza.map((_, i) => (
                    <Cell key={i} fill={CORES[i % CORES.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => formatarMoeda(v)} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-slate-400 text-center py-16">Nenhum gasto registrado</p>
          )}
        </div>
      )}

      {/* Barras */}
      {graficoAtivo === 'barras' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Valor Total vs Gasto por Parlamentar</h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={dadosBarras}>
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v) => formatarMoeda(v)} />
              <Legend />
              <Bar dataKey="valorTotal" name="Valor Total" fill="#1e40af" radius={[4, 4, 0, 0]} />
              <Bar dataKey="gasto" name="Gasto" fill="#d97706" radius={[4, 4, 0, 0]} />
              <Bar dataKey="saldo" name="Saldo" fill="#059669" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Radar */}
      {graficoAtivo === 'radar' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Distribuição por Elemento de Despesa</h3>
          {dadosRadar.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <RadarChart data={dadosRadar}>
                <PolarGrid />
                <PolarAngleAxis dataKey="elemento" tick={{ fontSize: 11 }} />
                <PolarRadiusAxis tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                <Radar name="Gastos" dataKey="valor" stroke="#1e40af" fill="#1e40af" fillOpacity={0.3} />
                <Tooltip formatter={(v) => formatarMoeda(v)} />
              </RadarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-slate-400 text-center py-16">Nenhum gasto registrado</p>
          )}
        </div>
      )}

      {/* Evolução Mensal */}
      {graficoAtivo === 'evolucao' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Evolução Mensal de Gastos</h3>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={dadosEvolucao}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v) => formatarMoeda(v)} />
              <Legend />
              <Line type="monotone" dataKey="mensal" name="Gasto Mensal" stroke="#1e40af" strokeWidth={2} dot={{ fill: '#1e40af', r: 4 }} />
              <Line type="monotone" dataKey="acumulado" name="Acumulado" stroke="#dc2626" strokeWidth={2} strokeDasharray="5 5" dot={{ fill: '#dc2626', r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
