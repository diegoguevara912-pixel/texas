import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import Home from './pages/Home.jsx';
import Catalog from './pages/Catalog.jsx';
import VehicleDetail from './pages/VehicleDetail.jsx';
import { Compare, Contact, Financing, NotFound, Privacy } from './pages/Pages.jsx';
import { SiteProvider, useSite } from './lib/site.jsx';

const Admin = lazy(() => import('./admin/Admin.jsx'));

function Gate({ children }) {
  const site = useSite();
  if (site.loading) return <div className="loader-line" />;
  if (site.error) {
    return (
      <div className="page-head wrap empty" style={{ marginTop: '6rem' }}>
        <h1 className="h3">No pudimos cargar el sitio</h1>
        <p className="muted">{site.error}</p>
        <button className="btn btn-primary" onClick={() => window.location.reload()}>Reintentar</button>
      </div>
    );
  }
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/admin/*" element={<Suspense fallback={<div className="loader-line" />}><Admin /></Suspense>} />
      <Route
        element={
          <SiteProvider>
            <Gate><Layout /></Gate>
          </SiteProvider>
        }
      >
        <Route index element={<Home />} />
        <Route path="inventario" element={<Catalog />} />
        <Route path="vehiculo/:slug" element={<VehicleDetail />} />
        <Route path="financiamiento" element={<Financing />} />
        <Route path="contacto" element={<Contact />} />
        <Route path="comparar" element={<Compare />} />
        <Route path="privacidad" element={<Privacy />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
