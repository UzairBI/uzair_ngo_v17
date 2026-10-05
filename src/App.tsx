import { Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import About from "./pages/About";
import Projects from "./pages/Projects";
import ProjectDetail from "./pages/ProjectDetail";
import Media from "./pages/Media";
import Transparency from "./pages/Transparency";
import Contact from "./pages/Contact";
import Donate from "./pages/Donate";
import GetInvolved from "./pages/GetInvolved";
import Legal from "./pages/Legal";
import NotFound from "./pages/NotFound";
import News from "./pages/News";
import NewsDetail from "./pages/NewsDetail";
import Events from "./pages/Events";
import Journey from "./pages/Journey";
import AnnualReports from "./pages/AnnualReports";
import ImpactReport from "./pages/ImpactReport";
import Awards from "./pages/Awards";
export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/about/journey" element={<Journey />} />
        <Route path="/about/awards" element={<Awards />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/projects/:slug" element={<ProjectDetail />} />
        <Route path="/media" element={<Media />} />
        <Route path="/news" element={<News />} />
        <Route path="/news/:slug" element={<NewsDetail />} />
        <Route path="/events" element={<Events />} />
        <Route path="/transparency" element={<Transparency />} />
        <Route path="/transparency/annual-reports" element={<AnnualReports />} />
        <Route path="/transparency/impact-report" element={<ImpactReport />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/donate" element={<Donate />} />
        <Route path="/get-involved" element={<GetInvolved />} />
        <Route path="/privacy" element={<Legal kind="privacy" />} />
        <Route path="/terms" element={<Legal kind="terms" />} />
        <Route path="/dpdp" element={<Legal kind="dpdp" />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
