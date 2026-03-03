import React, { useCallback, useEffect, useState } from 'react';
import styled, { createGlobalStyle, keyframes } from 'styled-components';
import './App.css';

// ─── Types ────────────────────────────────────────────────────────────────────

interface MapLocation {
  id: number;
  coords: [number, number];
  name: string;
  type: { id: number; name: string };
  biome: { id: number; name: string };
  levelReq: number;
  lore: string;
  players: string[];
}

// ─── Biome Config ─────────────────────────────────────────────────────────────

const BIOME_CONFIG: Record<string, { icon: string; gradient: string; textColor: string; glowColor: string }> = {
  Coast:     { icon: '🌊', gradient: 'linear-gradient(135deg, #0d3b52 0%, #1a6b8a 50%, #1e8fa0 100%)', textColor: '#b8eaf7', glowColor: '#2980b9' },
  Mountains: { icon: '⛰️', gradient: 'linear-gradient(135deg, #0f1519 0%, #1c2b38 50%, #2c3e50 100%)', textColor: '#cddce8', glowColor: '#4a6fa5' },
  Forest:    { icon: '🌲', gradient: 'linear-gradient(135deg, #071a0d 0%, #0d3b1c 50%, #145a32 100%)', textColor: '#b8f0cc', glowColor: '#27ae60' },
  Plains:    { icon: '🌾', gradient: 'linear-gradient(135deg, #3d3104 0%, #7d6608 50%, #b7950b 100%)', textColor: '#fef3b8', glowColor: '#d4ac0d' },
  Swamp:     { icon: '🌿', gradient: 'linear-gradient(135deg, #100b1f 0%, #2e1040 50%, #4a235a 100%)', textColor: '#d9b8f0', glowColor: '#8e44ad' },
  Desert:    { icon: '🏜️', gradient: 'linear-gradient(135deg, #3d1806 0%, #7a2e0a 50%, #a04000 100%)', textColor: '#fad9b0', glowColor: '#d35400' },
  Plateau:   { icon: '🗻', gradient: 'linear-gradient(135deg, #3b0c09 0%, #7b1f19 50%, #922b21 100%)', textColor: '#f5c6c2', glowColor: '#c0392b' },
  Moors:     { icon: '🌫️', gradient: 'linear-gradient(135deg, #1a1a1a 0%, #2e2e2e 50%, #484848 100%)', textColor: '#d6d6d6', glowColor: '#7f8c8d' },
  Town:      { icon: '🏘️', gradient: 'linear-gradient(135deg, #13131f 0%, #1e1e35 50%, #2b2b4a 100%)', textColor: '#e8e8f5', glowColor: '#8e8eb0' },
  Grassland: { icon: '🍃', gradient: 'linear-gradient(135deg, #062014 0%, #0c3d25 50%, #155e36 100%)', textColor: '#b8f0cc', glowColor: '#2ecc71' },
  Caves:     { icon: '🕳️', gradient: 'linear-gradient(135deg, #050505 0%, #0d1117 50%, #1a2230 100%)', textColor: '#9eb3c2', glowColor: '#4a6274' },
  Haunted:   { icon: '💀', gradient: 'linear-gradient(135deg, #070007 0%, #12001f 50%, #200040 100%)', textColor: '#d4b8f0', glowColor: '#8b3dba' },
};

const DEFAULT_BIOME = {
  icon: '🗺️',
  gradient: 'linear-gradient(135deg, #0f0f1f 0%, #1a1a2e 100%)',
  textColor: '#c8d0d8',
  glowColor: '#4a5568',
};

// ─── Animations ───────────────────────────────────────────────────────────────

const pulse = keyframes`
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.75; transform: scale(1.08); }
`;

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const shimmer = keyframes`
  0%   { background-position: -400px 0; }
  100% { background-position:  400px 0; }
`;

// ─── Global Styles ────────────────────────────────────────────────────────────

const GlobalStyle = createGlobalStyle`
  body {
    font-family: 'Crimson Text', Georgia, serif;
    background: #080810;
    -webkit-font-smoothing: antialiased;
  }
`;

// ─── Layout ───────────────────────────────────────────────────────────────────

const AppWrapper = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: radial-gradient(ellipse at top, #16163a 0%, #080810 65%);
`;

const Header = styled.header`
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(8, 8, 20, 0.9);
  backdrop-filter: blur(14px);
  border-bottom: 1px solid rgba(255, 215, 0, 0.12);
  padding: 12px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const HeaderTitle = styled.h1`
  font-family: 'Cinzel', Georgia, serif;
  font-size: 1.35rem;
  color: #ffd700;
  margin: 0;
  letter-spacing: 0.09em;
  text-shadow: 0 0 24px rgba(255, 215, 0, 0.35);
`;

const HeaderRight = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const PlayerCountBadge = styled.div`
  background: rgba(255, 215, 0, 0.12);
  border: 1px solid rgba(255, 215, 0, 0.28);
  border-radius: 20px;
  padding: 4px 14px;
  font-family: 'Cinzel', serif;
  font-size: 0.75rem;
  color: #ffd700;
  letter-spacing: 0.06em;
`;

const RefreshBadge = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 4px 14px;
  font-size: 0.72rem;
  color: rgba(255, 255, 255, 0.4);
`;

const Main = styled.main`
  flex: 1;
  padding: 24px 16px 48px;
`;

const MapWrapper = styled.div`
  max-width: 1200px;
  margin: 0 auto;
`;

const MapGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 10px;

  @media (max-width: 900px) {
    grid-template-columns: repeat(4, 1fr);
  }

  @media (max-width: 580px) {
    grid-template-columns: repeat(3, 1fr);
  }
`;

// ─── Tile ─────────────────────────────────────────────────────────────────────

const TileCard = styled.div<{ $gradient: string; $glowColor: string }>`
  aspect-ratio: 1 / 1.1;
  border-radius: 10px;
  background: ${({ $gradient }) => $gradient};
  border: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  flex-direction: column;
  padding: 9px 9px 8px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: transform 0.17s ease, box-shadow 0.17s ease;
  animation: ${fadeIn} 0.3s ease both;

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 10px;
    border: 2px solid ${({ $glowColor }) => $glowColor};
    opacity: 0;
    transition: opacity 0.17s ease;
    pointer-events: none;
  }

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 34px ${({ $glowColor }) => $glowColor}50;

    &::after {
      opacity: 1;
    }
  }

  &:focus-visible {
    outline: 2px solid ${({ $glowColor }) => $glowColor};
    outline-offset: 3px;
  }
`;

const TileTop = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
`;

const BiomeIcon = styled.span`
  font-size: 1.75rem;
  line-height: 1;
  filter: drop-shadow(0 2px 5px rgba(0, 0, 0, 0.55));
`;

const BadgesColumn = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
`;

const TypeBadge = styled.span<{ $textColor: string }>`
  font-family: 'Cinzel', serif;
  font-size: 0.48rem;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: ${({ $textColor }) => $textColor};
  background: rgba(0, 0, 0, 0.38);
  border-radius: 4px;
  padding: 2px 5px;
  opacity: 0.82;
`;

const PlayerCountPill = styled.div<{ $glowColor: string }>`
  font-family: 'Cinzel', serif;
  font-size: 0.52rem;
  font-weight: 700;
  color: #fff;
  background: ${({ $glowColor }) => $glowColor}cc;
  border-radius: 10px;
  padding: 2px 7px;
  animation: ${pulse} 2.2s ease-in-out infinite;
  box-shadow: 0 0 8px ${({ $glowColor }) => $glowColor}80;
`;

const TileBody = styled.div<{ $textColor: string }>`
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  color: ${({ $textColor }) => $textColor};
`;

const TileName = styled.div`
  font-family: 'Cinzel', serif;
  font-size: 0.62rem;
  font-weight: 600;
  letter-spacing: 0.03em;
  line-height: 1.25;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.65);
`;

const TileBiome = styled.div`
  font-size: 0.52rem;
  opacity: 0.65;
  margin-top: 2px;
`;

const PlayersPreview = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 3px;
  margin-top: 5px;
`;

const PlayerDot = styled.span<{ $glowColor: string }>`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: ${({ $glowColor }) => $glowColor};
  box-shadow: 0 0 5px ${({ $glowColor }) => $glowColor};
  display: inline-block;
  flex-shrink: 0;
`;

const OverflowDots = styled.span`
  font-size: 0.48rem;
  opacity: 0.55;
  align-self: center;
`;

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const SkeletonCard = styled.div`
  aspect-ratio: 1 / 1.1;
  border-radius: 10px;
  background: linear-gradient(
    90deg,
    #12122a 25%,
    #1c1c3a 50%,
    #12122a 75%
  );
  background-size: 400px 100%;
  animation: ${shimmer} 1.5s ease-in-out infinite;
  border: 1px solid rgba(255, 255, 255, 0.04);
`;

// ─── Modal / Overlay ──────────────────────────────────────────────────────────

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 5, 0.78);
  backdrop-filter: blur(5px);
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  animation: ${fadeIn} 0.15s ease;
`;

const Modal = styled.div`
  background: #0c0c1e;
  border: 1px solid rgba(255, 215, 0, 0.18);
  border-radius: 14px;
  max-width: 480px;
  width: 100%;
  overflow: hidden;
  box-shadow: 0 28px 90px rgba(0, 0, 0, 0.8);
`;

const ModalHeader = styled.div<{ $gradient: string }>`
  background: ${({ $gradient }) => $gradient};
  padding: 20px 20px 16px;
  display: flex;
  align-items: flex-start;
  gap: 14px;
`;

const ModalIcon = styled.span`
  font-size: 2.4rem;
  line-height: 1;
  filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.55));
  flex-shrink: 0;
`;

const ModalTitleBlock = styled.div`
  flex: 1;
  min-width: 0;
`;

const ModalName = styled.h2`
  font-family: 'Cinzel', serif;
  font-size: 1.1rem;
  color: #fff;
  margin: 0 0 8px;
  text-shadow: 0 1px 6px rgba(0, 0, 0, 0.6);
  letter-spacing: 0.05em;
  word-break: break-word;
`;

const MetaTags = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
`;

const MetaTag = styled.span`
  font-family: 'Cinzel', serif;
  font-size: 0.58rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  background: rgba(0, 0, 0, 0.42);
  color: rgba(255, 255, 255, 0.82);
  border-radius: 4px;
  padding: 3px 8px;
`;

const CloseButton = styled.button`
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 50%;
  width: 30px;
  height: 30px;
  color: rgba(255, 255, 255, 0.8);
  font-size: 1.1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  line-height: 1;
  transition: background 0.14s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.15);
  }
`;

const ModalBody = styled.div`
  padding: 18px 20px 22px;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const CoordsInfo = styled.div`
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.35);
  font-family: 'Cinzel', serif;
  letter-spacing: 0.06em;
`;

const LoreSection = styled.p`
  font-family: 'Crimson Text', Georgia, serif;
  font-style: italic;
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.65);
  margin: 0;
  line-height: 1.65;
`;

const PlayersSection = styled.div``;

const PlayersSectionTitle = styled.div`
  font-family: 'Cinzel', serif;
  font-size: 0.68rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: rgba(255, 215, 0, 0.65);
  margin-bottom: 8px;
`;

const PlayerTagsList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`;

const PlayerTag = styled.span`
  background: rgba(255, 255, 255, 0.07);
  border: 1px solid rgba(255, 255, 255, 0.13);
  border-radius: 6px;
  padding: 4px 10px;
  font-size: 0.82rem;
  color: rgba(255, 255, 255, 0.82);
`;

const EmptyPlayers = styled.div`
  font-size: 0.82rem;
  color: rgba(255, 255, 255, 0.28);
  font-style: italic;
`;

// ─── Component ────────────────────────────────────────────────────────────────

function MapPage() {
  const [mapData, setMapData] = useState<MapLocation[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMap, setSelectedMap] = useState<MapLocation | null>(null);
  const [countdown, setCountdown] = useState(60);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchMapData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch('/map');
      const data = await res.json();
      const sorted: MapLocation[] = (Object.values(data.maps) as MapLocation[])
        .sort((a, b) => a.coords[1] - b.coords[1] || a.coords[0] - b.coords[0]);
      setMapData(sorted);
    } catch {
      // keep existing data on fetch error
    } finally {
      setLoading(false);
      setIsRefreshing(false);
      setCountdown(60);
    }
  }, []);

  useEffect(() => {
    fetchMapData();
    const interval = setInterval(fetchMapData, 60_000);
    return () => clearInterval(interval);
  }, [fetchMapData]);

  useEffect(() => {
    const tick = setInterval(() => {
      setCountdown(c => (c <= 1 ? 60 : c - 1));
    }, 1000);
    return () => clearInterval(tick);
  }, []);

  const totalOnline = mapData
    ? mapData.reduce((sum, loc) => sum + loc.players.length, 0)
    : 0;

  return (
    <>
      <GlobalStyle />
      <AppWrapper>
        <Header>
          <HeaderTitle>⚔ Realm of Idle Legends</HeaderTitle>
          <HeaderRight>
            {!loading && (
              <PlayerCountBadge>{totalOnline} Online</PlayerCountBadge>
            )}
            <RefreshBadge>
              {isRefreshing ? 'Refreshing…' : `Refresh in ${countdown}s`}
            </RefreshBadge>
          </HeaderRight>
        </Header>

        <Main>
          <MapWrapper>
            <MapGrid>
              {loading
                ? Array.from({ length: 36 }, (_, i) => <SkeletonCard key={i} />)
                : mapData?.map(loc => {
                    const bio = BIOME_CONFIG[loc.biome?.name] ?? DEFAULT_BIOME;
                    return (
                      <TileCard
                        key={loc.id}
                        $gradient={bio.gradient}
                        $glowColor={bio.glowColor}
                        role="button"
                        tabIndex={0}
                        aria-label={`${loc.name}, ${loc.biome?.name} biome`}
                        onClick={() => setSelectedMap(loc)}
                        onKeyDown={e => e.key === 'Enter' && setSelectedMap(loc)}
                      >
                        <TileTop>
                          <BiomeIcon>{bio.icon}</BiomeIcon>
                          <BadgesColumn>
                            <TypeBadge $textColor={bio.textColor}>
                              {loc.type?.name ?? 'Area'}
                            </TypeBadge>
                            {loc.players.length > 0 && (
                              <PlayerCountPill $glowColor={bio.glowColor}>
                                {loc.players.length} ▲
                              </PlayerCountPill>
                            )}
                          </BadgesColumn>
                        </TileTop>
                        <TileBody $textColor={bio.textColor}>
                          <TileName>{loc.name}</TileName>
                          <TileBiome>{loc.biome?.name}</TileBiome>
                          {loc.players.length > 0 && (
                            <PlayersPreview>
                              {loc.players.slice(0, 8).map((_, idx) => (
                                <PlayerDot key={idx} $glowColor={bio.glowColor} />
                              ))}
                              {loc.players.length > 8 && (
                                <OverflowDots>+{loc.players.length - 8}</OverflowDots>
                              )}
                            </PlayersPreview>
                          )}
                        </TileBody>
                      </TileCard>
                    );
                  })
              }
            </MapGrid>
          </MapWrapper>
        </Main>

        {selectedMap && (() => {
          const bio = BIOME_CONFIG[selectedMap.biome?.name] ?? DEFAULT_BIOME;
          return (
            <Overlay onClick={() => setSelectedMap(null)}>
              <Modal
                onClick={e => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-label={selectedMap.name}
              >
                <ModalHeader $gradient={bio.gradient}>
                  <ModalIcon>{bio.icon}</ModalIcon>
                  <ModalTitleBlock>
                    <ModalName>{selectedMap.name}</ModalName>
                    <MetaTags>
                      <MetaTag>{selectedMap.biome?.name}</MetaTag>
                      <MetaTag>{selectedMap.type?.name}</MetaTag>
                      {selectedMap.levelReq > 0 && (
                        <MetaTag>Lv {selectedMap.levelReq}+</MetaTag>
                      )}
                    </MetaTags>
                  </ModalTitleBlock>
                  <CloseButton
                    onClick={() => setSelectedMap(null)}
                    aria-label="Close"
                  >
                    ×
                  </CloseButton>
                </ModalHeader>
                <ModalBody>
                  <CoordsInfo>
                    Coordinates: ({selectedMap.coords[0]}, {selectedMap.coords[1]})
                  </CoordsInfo>
                  {selectedMap.lore && (
                    <LoreSection>{selectedMap.lore}</LoreSection>
                  )}
                  <PlayersSection>
                    <PlayersSectionTitle>
                      {selectedMap.players.length > 0
                        ? `${selectedMap.players.length} Adventurer${selectedMap.players.length !== 1 ? 's' : ''} Present`
                        : 'Adventurers'}
                    </PlayersSectionTitle>
                    {selectedMap.players.length > 0 ? (
                      <PlayerTagsList>
                        {selectedMap.players.map((p, i) => (
                          <PlayerTag key={i}>{p}</PlayerTag>
                        ))}
                      </PlayerTagsList>
                    ) : (
                      <EmptyPlayers>No adventurers here...</EmptyPlayers>
                    )}
                  </PlayersSection>
                </ModalBody>
              </Modal>
            </Overlay>
          );
        })()}
      </AppWrapper>
    </>
  );
}

function App() {
  return <MapPage />;
}

export default App;
