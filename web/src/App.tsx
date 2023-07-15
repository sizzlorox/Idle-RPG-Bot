import { useEffect, useState } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import styled from 'styled-components'
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';

import './App.css';

const router = createBrowserRouter([
  // {
  //   path: '/',
  //   element: <Home />
  // },
  // {
  //   path: '/about',
  //   element: <About />
  // },
  // {
  //   path: '/leaderboards',
  //   element: <Leaderboards />
  // },
  {
    path: '*',
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


function sortByPosition(a: number[], b: number[]){
  if (a[0] === b[0]) return a[1] - b[1];
  return a[0] - b[0];
}


const MapCellContainer = styled.div<{ biome: string }>`
  height: 240px;
  overflow: auto;
  padding: 8px;
  ${({ biome }: { biome: string }) => {
    if (biome === 'Coast') return `background-color: #3498db;`;
    if (biome === 'Mountains') return `background-color: #2c3e50; color: white;`;
    if (biome === 'Forest') return `background-color: #27ae60;`;
    if (biome === 'Plains') return `background-color: #f1c40f;`;
    if (biome === 'Swamp') return `background-color: #8e44ad; color: white;`;
    if (biome === 'Desert') return `background-color: #e67e22;`;
    if (biome === 'Plateau') return `background-color: #e74c3c; color: white`;
    if (biome === 'Moors') return `background-color: #95a5a6;`;
    if (biome === 'Town') return `background-color: #ecf0f1;`;
    if (biome === 'Grassland') return `background-color: #2ecc71;`;
    if (biome === 'Caves') return `background-color: #34495e; color: white;`;
    if (biome === 'Haunted') return `background-color: #9b59b6; color: white;`;
  }}
`;

const MapCellHeader = styled.div`
  font-weight: bold;
`;

function MapCell({ map }: { map: any }) {
  return (
    <MapCellContainer biome={map.biome.name}>
      <MapCellHeader>
        {map.name} ({map.biome.name})
      </MapCellHeader>
      {map.players.map((player: string) => (<div>{player}</div>))}
    </MapCellContainer>
  );
}

function Map() {
  const [mapData, setMapData] = useState<any>();

  useEffect(() => {
    fetch('/map')
      .then(res => res.json())
      .then(data => setMapData(
        Object.values(data.maps)
          .sort((a: any, b: any) => sortByPosition(a.coords, b.coords))
          .reduce((acc: any, obj: any, index) => {
            const groupIndex = Math.floor(index / 6);
            if (!acc[groupIndex]) {
              acc[groupIndex] = {};
            }
            Object.assign(acc[groupIndex], { [`x${(index % 6) + 1}`]: { name: obj.name, biome: obj.biome, players: obj.players } });
            return acc;
          }, [])
      ));
  }, []);

  return (
    <div className="map">
      <h1>Map</h1>
      <DataTable value={mapData} header={null} showGridlines>
        <Column field="x1" body={(row: any) => <MapCell map={row.x1} />} header=""></Column>
        <Column field="x2" body={(row: any) => <MapCell map={row.x2} />} header=""></Column>
        <Column field="x3" body={(row: any) => <MapCell map={row.x3} />} header=""></Column>
        <Column field="x4" body={(row: any) => <MapCell map={row.x4} />} header=""></Column>
        <Column field="x5" body={(row: any) => <MapCell map={row.x5} />} header=""></Column>
        <Column field="x6" body={(row: any) => <MapCell map={row.x6} />} header=""></Column>
      </DataTable>
    </div>
  );
}

function App() {
  return (
    <div className="container">
      <header className="header">
        {/* <a href="/" className="menu-item">Home</a>
        <a href="/about" className="menu-item">About</a>
        <a href="/leaderboards" className="menu-item">Leaderboards</a> */}
        <a href="/map" className="menu-item">Map</a>
      </header>
      <main className="main">
        <RouterProvider router={router} />
      </main>
    </div>
  );
}
export default App;
