import { useProductos } from "../../hooks/useProductos";
import { useVentas } from "../../hooks/useVentas";
import { useClientes } from "../../hooks/useClientes";
import { useDevoluciones } from "../../hooks/useDevoluciones";
import { formatMoney, formatDate } from "../../utils/utils";

export default function Estadisticas() {
  const { productos } = useProductos();
  const { ventas } = useVentas();
  const { clientes } = useClientes();
  const { devoluciones } = useDevoluciones();

  // Cálculos
  const hoy = new Date().setHours(0, 0, 0, 0);
  const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime();

  const ventasHoy = ventas.filter(v => v.timestamp >= hoy);
  const ventasMes = ventas.filter(v => v.timestamp >= inicioMes);
  const totalHoy = ventasHoy.reduce((sum, v) => sum + (v.total || 0), 0);
  const totalMes = ventasMes.reduce((sum, v) => sum + (v.total || 0), 0);
  const totalDevoluciones = devoluciones.reduce((sum, d) => sum + (d.total || 0), 0);
  const stockBajo = productos.filter(p => p.cantidad <= 5 && p.cantidad > 0);
  const sinStock = productos.filter(p => p.cantidad <= 0);

  // Top 5 productos más vendidos
  const conteoProductos = {};
  ventas.forEach(v => {
    v.items?.forEach(item => {
      conteoProductos[item.nombre] = (conteoProductos[item.nombre] || 0) + item.cantidad;
    });
  });
  const topProductos = Object.entries(conteoProductos)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Últimas 5 ventas
  const ultimasVentas = ventas.slice(0, 5);

  // Métodos de pago
  const metodosPago = {};
  ventas.forEach(v => {
    const metodo = v.forma || "efectivo";
    metodosPago[metodo] = (metodosPago[metodo] || 0) + 1;
  });

  return (
    <div>
      {/* Stats principales */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="icon">📅</div>
          <h4>Ventas del Día</h4>
          <div className="value">{formatMoney(totalHoy)}</div>
          <div className="trend">{ventasHoy.length} transacciones</div>
        </div>
        <div className="stat-card green">
          <div className="icon">📆</div>
          <h4>Ventas del Mes</h4>
          <div className="value">{formatMoney(totalMes)}</div>
          <div className="trend">{ventasMes.length} transacciones</div>
        </div>
        <div className="stat-card purple">
          <div className="icon">📦</div>
          <h4>Productos en Stock</h4>
          <div className="value">{productos.length}</div>
          <div className="trend">{sinStock.length} sin stock</div>
        </div>
        <div className="stat-card orange">
          <div className="icon">👥</div>
          <h4>Clientes</h4>
          <div className="value">{clientes.length}</div>
          <div className="trend">registrados</div>
        </div>
        <div className="stat-card red">
          <div className="icon">🔄</div>
          <h4>Devoluciones</h4>
          <div className="value">{devoluciones.length}</div>
          <div className="trend">-{formatMoney(totalDevoluciones)}</div>
        </div>
        <div className="stat-card">
          <div className="icon">💰</div>
          <h4>Ganancia Neta Mes</h4>
          <div className="value">{formatMoney(totalMes - totalDevoluciones)}</div>
          <div className="trend">ventas - devoluciones</div>
        </div>
      </div>

      {/* Alertas de stock */}
      {(stockBajo.length > 0 || sinStock.length > 0) && (
        <div className="card" style={{ borderTop: "4px solid #e74c3c" }}>
          <h3>⚠️ Alertas de Inventario</h3>
          {sinStock.length > 0 && (
            <div style={{ marginBottom: "15px" }}>
              <h4 style={{ color: "#e74c3c", marginBottom: "10px" }}>
                🚫 Sin Stock ({sinStock.length})
              </h4>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {sinStock.map(p => (
                  <span key={p.id} className="badge badge-danger">{p.nombre}</span>
                ))}
              </div>
            </div>
          )}
          {stockBajo.length > 0 && (
            <div>
              <h4 style={{ color: "#f39c12", marginBottom: "10px" }}>
                ⚠️ Stock Bajo — menos de 5 unidades ({stockBajo.length})
              </h4>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {stockBajo.map(p => (
                  <span key={p.id} className="badge badge-warning">
                    {p.nombre} ({p.cantidad})
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "25px" }}>
        {/* Top productos */}
        <div className="card">
          <h3>🏆 Top 5 Productos Más Vendidos</h3>
          {topProductos.length === 0 ? (
            <p style={{ color: "#7f8c8d" }}>Aún no hay ventas registradas</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Producto</th>
                  <th>Unidades</th>
                </tr>
              </thead>
              <tbody>
                {topProductos.map(([nombre, cantidad], i) => (
                  <tr key={nombre}>
                    <td>
                      <span style={{ fontSize: "20px" }}>
                        {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`}
                      </span>
                    </td>
                    <td><strong>{nombre}</strong></td>
                    <td>
                      <span className="badge badge-success">{cantidad} uds</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Métodos de pago */}
        <div className="card">
          <h3>💳 Métodos de Pago</h3>
          {Object.keys(metodosPago).length === 0 ? (
            <p style={{ color: "#7f8c8d" }}>Aún no hay ventas registradas</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Método</th>
                  <th>Transacciones</th>
                  <th>%</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(metodosPago).map(([metodo, count]) => (
                  <tr key={metodo}>
                    <td>
                      {metodo === "efectivo" ? "💵" :
                       metodo === "tarjeta" ? "💳" :
                       metodo === "transferencia" ? "🏦" : "📱"} {metodo}
                    </td>
                    <td>{count}</td>
                    <td>
                      <span className="badge badge-info">
                        {Math.round((count / ventas.length) * 100)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Últimas ventas */}
      <div className="card">
        <h3>🕐 Últimas 5 Ventas</h3>
        {ultimasVentas.length === 0 ? (
          <p style={{ color: "#7f8c8d" }}>Aún no hay ventas registradas</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Fecha</th>
                <th>Cliente</th>
                <th>Total</th>
                <th>Método</th>
                <th>Usuario</th>
              </tr>
            </thead>
            <tbody>
              {ultimasVentas.map(v => (
                <tr key={v.docId || v.id}>
                  <td><code>{v.id}</code></td>
                  <td>{formatDate(v.timestamp)}</td>
                  <td>{v.cliente?.nombre || "Mostrador"}</td>
                  <td><strong>{formatMoney(v.total)}</strong></td>
                  <td><span className="badge badge-info">{v.forma || "efectivo"}</span></td>
                  <td>{v.usuario}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
