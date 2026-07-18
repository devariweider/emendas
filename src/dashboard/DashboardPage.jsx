import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEmendas } from '../emendas/EmendasContext';
import { formatarMoeda } from '../utils/formatacao';
import { meses } from '../data/emendas';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, Legend } from 'recharts';

const CORES = ['#1e40af', '#059669', '#d97706', '#dc2626', '#7c3aed', '#0891b2'];

function KPICard({ titulo, valor, subtitulo, cor = 'blue', onClick }) {
  const cores = {
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    red: 'bg-red-50 text-red-700 border-red-200',
  };
  return (
    <div
      onClick={onClick}
      className={`rounded-xl border p-5 ${cores[cor]} ${onClick ? 'cursor-pointer hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all' : ''}`}
    >
      <p className="text-xs font-medium opacity-70 uppercase tracking-wide">{titulo}</p>
      <p className="text-2xl font-bold mt-2">{valor}</p>
      {subtitulo && <p className="text-xs mt-1 opacity-60">{subtitulo}</p>}
    </div>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { emendasComResumo, totais, gastos } = useEmendas();

  const dadosPizza = useMemo(() =>
    emendasComResumo.map((e) => ({
      name: e.parlamentar,
      value: e.totalGasto,
    })).filter((d) => d.value > 0),
  [emendasComResumo]);

  const dadosSaldo = useMemo(() =>
    emendasComResumo.map((e) => ({
      name: e.parlamentar,
      saldo: e.saldo,
      gasto: e.totalGasto,
    })),
  [emendasComResumo]);

  // Evolução mensal de gastos
  const dadosEvolucao = useMemo(() => {
    const porMes = {};
    for (let m = 1; m <= 12; m++) {
      porMes[m] = { mes: meses[m - 1].slice(0, 3), total: 0 };
    }
    gastos.forEach((g) => {
      if (g.data) {
        const mes = parseInt(g.data.split('-')[1], 10);
        if (mes >= 1 && mes <= 12) {
          porMes[mes].total += Number(g.valorPago) || 0;
        }
      }
    });
    return Object.values(porMes).filter((d) => d.total > 0 || Object.keys(porMes).indexOf(d.mes) < new Date().getMonth() + 1);
  }, [gastos]);

  // Gastos por elemento
  const dadosElemento = useMemo(() => {
    const agrupado = {};
    gastos.forEach((g) => {
      if (!agrupado[g.elementoDespesa]) agrupado[g.elementoDespesa] = 0;
      agrupado[g.elementoDespesa] += Number(g.valorPago) || 0;
    });
    return Object.entries(agrupado)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [gastos]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Dashboard</h2>
        <p className="text-sm text-slate-500 mt-1">Visão geral das emendas parlamentares — Exercício 2026</p>
      </div>

      {/* Alertas */}
      {totais.alertas.length > 0 && (
        <div className="space-y-2">
          {totais.alertas.map((a, i) => (
            <div
              key={i}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium ${
                a.tipo === 'critico'
                  ? 'bg-red-50 border border-red-200 text-red-700'
                  : a.tipo === 'alerta'
                    ? 'bg-amber-50 border border-amber-200 text-amber-700'
                    : 'bg-blue-50 border border-blue-200 text-blue-700'
              }`}
            >
              <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              {a.mensagem}
            </div>
          ))}
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard titulo="Total Emendas" valor={totais.qtdEmendas} subtitulo={`${formatarMoeda(totais.valorTotal)} empenhados`} cor="blue" onClick={() => navigate('/emendas')} />
        <KPICard titulo="Total Gasto" valor={formatarMoeda(totais.totalGasto)} subtitulo={`${totais.percentualGasto.toFixed(1)}% do total`} cor="amber" onClick={() => navigate('/relatorios')} />
        <KPICard titulo="Saldo Restante" valor={formatarMoeda(totais.saldo)} cor="green" onClick={() => navigate('/emendas')} />
        <KPICard titulo="Lançamentos" valor={totais.qtdGastos} subtitulo="registros de gasto" cor="blue" onClick={() => navigate('/graficos')} />
      </div>

      {/* Evolução Mensal */}
      {dadosEvolucao.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Evolução Mensal de Gastos</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={dadosEvolucao}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v) => formatarMoeda(v)} />
              <Line type="monotone" dataKey="total" name="Gasto Mensal" stroke="#1e40af" strokeWidth={2} dot={{ fill: '#1e40af', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pizza */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Gastos por Parlamentar</h3>
          {dadosPizza.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={dadosPizza} cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={4} dataKey="value" label={({ name, value }) => `${name}: ${formatarMoeda(value)}`}>
                  {dadosPizza.map((_, i) => (<Cell key={i} fill={CORES[i % CORES.length]} />))}
                </Pie>
                <Tooltip formatter={(v) => formatarMoeda(v)} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-slate-400 text-center py-12">Nenhum gasto</p>
          )}
        </div>

        {/* Barras Saldo */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Saldo vs Gasto</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={dadosSaldo}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v) => formatarMoeda(v)} />
              <Bar dataKey="gasto" name="Gasto" fill="#d97706" radius={[4, 4, 0, 0]} />
              <Bar dataKey="saldo" name="Saldo" fill="#059669" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Barras Elemento */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Por Elemento de Despesa</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={dadosElemento} layout="vertical">
              <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={90} />
              <Tooltip formatter={(v) => formatarMoeda(v)} />
              <Bar dataKey="value" name="Valor" fill="#7c3aed" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tabela resumo */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h3 className="text-sm font-semibold text-slate-700">Resumo das Emendas</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">Parlamentar</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">Processo SEI</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500">Valor Total</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500">Gasto</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500">Saldo</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500">% Gasto</th>
              </tr>
            </thead>
            <tbody>
              {emendasComResumo.map((e) => (
                <tr key={e.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-800">{e.parlamentar}</td>
                  <td className="px-4 py-3 text-slate-600 font-mono text-xs">{e.processoSEI}</td>
                  <td className="px-4 py-3 text-right text-slate-700">{formatarMoeda(e.valorTotal)}</td>
                  <td className="px-4 py-3 text-right text-amber-600 font-medium">{formatarMoeda(e.totalGasto)}</td>
                  <td className="px-4 py-3 text-right text-emerald-600 font-medium">{formatarMoeda(e.saldo)}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                      e.percentualGasto > 80 ? 'bg-red-100 text-red-700' :
                      e.percentualGasto > 50 ? 'bg-amber-100 text-amber-700' :
                      'bg-emerald-100 text-emerald-700'
                    }`}>
                      {e.percentualGasto.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-50 font-semibold">
                <td className="px-4 py-3" colSpan={2}>TOTAL GERAL</td>
                <td className="px-4 py-3 text-right">{formatarMoeda(totais.valorTotal)}</td>
                <td className="px-4 py-3 text-right text-amber-600">{formatarMoeda(totais.totalGasto)}</td>
                <td className="px-4 py-3 text-right text-emerald-600">{formatarMoeda(totais.saldo)}</td>
                <td className="px-4 py-3 text-center">
                  <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                    {totais.percentualGasto.toFixed(1)}%
                  </span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
