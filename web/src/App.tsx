import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import './App.css';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Home />
  },
  {
    path: '/about',
    element: <About />
  },
  {
    path: '/leaderboards',
    element: <Leaderboards />
  },
  {
    path: '/map',
    element: <Map />
  },
]);

function Home() {
  return (
    <div className="home">
      <h1>Home</h1>
    </div>
  );
}

function About() {
  return (
    <div className="about">
      <h1>About</h1>
    </div>
  );
}

function Leaderboards() {
  return (
    <div className="leaderboards">
      <h1>Leaderboards</h1>
    </div>
  );
}

function Map() {
  return (
    <div className="map">
      <h1>Map</h1>
      <table>
        <tr>
          <td className="table-cell">
            <span className="map-name">The Isles of Puckarmpit</span>
            <div className="map-user-list">
              <ul>
                <li>Port Grimonas</li>
              </ul>
            </div>
          </td>
          <td className="table-cell">
            <span className="map-name">Beach of Flames</span>
          </td>
          <td className="table-cell">Silent Raint City</td>
          <td className="table-cell">Uglyoch Temple</td>
          <td className="table-cell">Axeter</td>
          <td className="table-cell">Aldbarrow</td>
        </tr>
        <tr>
          <td className="table-cell">Opemdek Peak</td>
          <td className="table-cell">Appleview</td>
          <td className="table-cell">Sludgefold</td>
          <td className="table-cell">Witchlyn</td>
          <td className="table-cell">Polcester</td>
          <td className="table-cell">Pantbryde Plains</td>
        </tr>
        <tr>
          <td className="table-cell">Macingdon</td>
          <td className="table-cell">Rosepond</td>
          <td className="table-cell">Wintermere</td>
          <td className="table-cell">North Rendmount</td>
          <td className="table-cell">Modesarder Cave</td>
          <td className="table-cell">Holmsham</td>
        </tr>
        <tr>
          <td className="table-cell">Port Grimonas</td>
          <td className="table-cell">Danascus Fields</td>
          <td className="table-cell">Norpond</td>
          <td className="table-cell">Espion Peak</td>
          <td className="table-cell">Deerhaven</td>
          <td className="table-cell">Topscros Path</td>
        </tr>
        <tr>
          <td className="table-cell">Llynenham Cove</td>
          <td className="table-cell">Kingdom of Oldohaseth</td>
          <td className="table-cell">Neataman Lake</td>
          <td className="table-cell">Skullsampton</td>
          <td className="table-cell">Nastihenge Moors</td>
          <td className="table-cell">Wanaton Desert</td>
        </tr>
        <tr>
          <td className="table-cell">Cliff of Birds</td>
          <td className="table-cell">Auchterkeld Plateau</td>
          <td className="table-cell">Hellerscrutch Hill</td>
          <td className="table-cell">Kindale</td>
          <td className="table-cell">Woldingfords Barrows</td>
          <td className="table-cell">Kinwardine Desert</td>
        </tr>
      </table>
    </div>
  );
}

function App() {
  return (
    <div className="container">
      <header className="header">
        <a href="/" className="menu-item">Home</a>
        <a href="/about" className="menu-item">About</a>
        <a href="/leaderboards" className="menu-item">Leaderboards</a>
        <a href="/map" className="menu-item">Map</a>
      </header>
      <main className="main">
        <RouterProvider router={router} />
      </main>
    </div>
  );
}
export default App;
