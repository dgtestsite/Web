// script.js
// Fetch NHL teams and rosters from NHL Stats API and compute a 0-100 rating per player.
// Rating algorithm:
//  - Try to combine external fantasy rankings (if JSON URL provided and returns data in expected format).
//  - Otherwise compute rating from available NHL stats (goals, assists, points, shots, games).
//  - Normalize across players (league-wide) and map to 0-100.
//
// Expected external ranking JSON format (optional):
// [
//   { "playerId": 8478402, "rank": 12 }, ...
// ]
//
// Note: NHL public API endpoints used:
//  - https://statsapi.web.nhl.com/api/v1/teams
//  - https://statsapi.web.nhl.com/api/v1/teams/{teamId}/roster
//  - https://statsapi.web.nhl.com/api/v1/people/{personId}/stats?stats=statsSingleSeason&season=20242025
//
// The site runs fully in-browser. For production, consider backend caching and API key management.

const NHL_API = "https://statsapi.web.nhl.com/api/v1";
let allPlayers = []; // will hold {player, team, stats, rating, fantasyRank}

function el(q){ return document.querySelector(q) }
function createEl(tag, cls){ const e=document.createElement(tag); if(cls) e.className=cls; return e }

async function fetchJSON(url){ const r = await fetch(url); if(!r.ok) throw new Error('HTTP '+r.status); return r.json() }

async function loadTeams(){
  const data = await fetchJSON(`${NHL_API}/teams`);
  const teams = data.teams.sort((a,b)=>a.name.localeCompare(b.name));
  const sel = el('#teamSelect');
  sel.innerHTML = '<option value="all">All NHL Teams</option>';
  teams.forEach(t=>{
    const opt = document.createElement('option');
    opt.value = t.id;
    opt.textContent = t.name;
    sel.appendChild(opt);
  });
  return teams;
}

async function fetchRosterForTeam(teamId){
  const rosters = await fetchJSON(`${NHL_API}/teams/${teamId}?expand=team.roster`);
  const team = rosters.teams[0];
  const players = team.roster.roster.map(r=>{
    return { person: r.person, jerseyNumber: r.jerseyNumber, position: r.position, team: {id:team.id,name:team.name,abbrev:team.abbreviation} };
  });
  return players;
}

async function fetchPlayerSeasonStats(personId){
  // season 2024-25 used as an example; the NHL API will return 2024-25 stats if available
  const url = `${NHL_API}/people/${personId}/stats?stats=statsSingleSeason&season=20242025`;
  try{
    const data = await fetchJSON(url);
    const splits = data.stats[0] && data.stats[0].splits && data.stats[0].splits[0];
    if(!splits) return {};
    return splits.stat || {};
  }catch(e){
    console.warn("Failed to get stats for", personId, e);
    return {};
  }
}

function normalizeScores(values){
  // min-max normalize to [0,1]; if all equal, return 0.5 for each
  if(values.length===0) return [];
  const min = Math.min(...values);
  const max = Math.max(...values);
  if(max===min) return values.map(_=>0.5);
  return values.map(v => (v-min)/(max-min));
}

function ratingBadge(score){
  const span = createEl('span','rating');
  const rounded = Math.round(score);
  span.textContent = rounded;
  if(rounded>=75) span.classList.add('high');
  else if(rounded>=45) span.classList.add('mid');
  else span.classList.add('low');
  return span;
}

async function computeRatings(externalRankings){
  // externalRankings: mapping playerId -> rank (lower is better)
  // We'll compute a composite score using:
  //  - fantasy rank (if available) -> 40%
  //  - points-per-game or points -> 40%
  //  - recent indicator (shots per game) -> 20%
  //
  // For players missing stats, handle gracefully.

  // Build arrays for normalization
  const fantasyVals = [];
  const pointsVals = [];
  const shotsVals = [];

  allPlayers.forEach(p=>{
    const pid = p.person.id;
    const fr = externalRankings && externalRankings[pid] ? externalRankings[pid] : null;
    // fantasy score: inverse of rank (lower rank -> higher value)
    fantasyVals.push(fr ? (1 / fr) : 0); // smaller rank -> larger 1/rank
    const stats = p.stats || {};
    const points = stats.points || 0;
    const games = stats.games || 1;
    pointsVals.push(points);
    const shots = stats.shots || 0;
    shotsVals.push(shots);
  });

  const fantasyNorm = normalizeScores(fantasyVals);
  const pointsNorm = normalizeScores(pointsVals);
  const shotsNorm = normalizeScores(shotsVals);

  // weights
  const wFantasy = 0.40;
  const wPoints = 0.40;
  const wShots = 0.20;

  allPlayers.forEach((p, i)=>{
    const f = fantasyNorm[i] || 0;
    const pts = pointsNorm[i] || 0;
    const sh = shotsNorm[i] || 0;
    const raw = wFantasy*f + wPoints*pts + wShots*sh; // in [0,1] roughly
    // map to 0-100; we also apply slight scaling so top players can reach high 90s
    p.rating = Math.round(Math.min(100, raw * 110));
    p.fantasyRank = externalRankings && externalRankings[p.person.id] ? externalRankings[p.person.id] : null;
  });
}

function renderTeams(filterTeamId){
  const container = el('#teamsContainer');
  container.innerHTML = '';
  const teamsMap = {};
  allPlayers.forEach(p=>{
    const tid = p.team.id;
    teamsMap[tid] = teamsMap[tid] || { team: p.team, players: [] };
    teamsMap[tid].players.push(p);
  });

  const teamEntries = Object.values(teamsMap).sort((a,b)=>a.team.name.localeCompare(b.team.name));
  teamEntries.forEach(teamEntry=>{
    if(filterTeamId && filterTeamId!=='all' && String(teamEntry.team.id) !== String(filterTeamId)) return;
    const card = createEl('div','team-card');
    const h2 = createEl('h2'); h2.textContent = teamEntry.team.name + ` (${teamEntry.team.abbrev})`;
    card.appendChild(h2);

    const table = createEl('table','player-table');
    table.innerHTML = `<thead><tr><th>Player</th><th>Pos</th><th>Rating</th><th>Fantasy Rank</th><th class="player-meta">G A P</th></tr></thead>`;
    const tbody = createEl('tbody');
    teamEntry.players.sort((a,b)=> (b.rating||0) - (a.rating||0));
    teamEntry.players.forEach(p=>{
      const tr = createEl('tr');
      const nameTd = createEl('td'); nameTd.innerHTML = `<strong>${p.person.fullName}</strong><div class="player-meta">#${p.jerseyNumber || '-'} </div>`;
      const posTd = createEl('td'); posTd.textContent = p.position && p.position.abbreviation ? p.position.abbreviation : (p.position ? p.position : '-');
      const ratingTd = createEl('td'); ratingTd.appendChild(ratingBadge(p.rating || 0));
      const frTd = createEl('td'); frTd.textContent = p.fantasyRank ? String(p.fantasyRank) : '-';
      const metaTd = createEl('td'); metaTd.className='player-meta'; const s=p.stats||{}; metaTd.textContent = `${s.goals||0} ${s.assists||0} ${s.points||0}`;

      tr.appendChild(nameTd); tr.appendChild(posTd); tr.appendChild(ratingTd); tr.appendChild(frTd); tr.appendChild(metaTd);
      tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    card.appendChild(table);
    container.appendChild(card);
  });
}

async function mainLoad(filterTeamId=null, rankingUrl=null){
  el('#status').textContent = 'Loading rosters...';
  try{
    allPlayers = [];
    // load teams list (so we can map ids to names later)
    const teamsResp = await fetchJSON(`${NHL_API}/teams`);
    const teams = teamsResp.teams;

    // pick teams to load
    const toLoad = (filterTeamId && filterTeamId!=='all') ? teams.filter(t=>String(t.id)===String(filterTeamId)) : teams;

    // fetch rosters for each team in parallel, but avoid launching hundreds of requests at once
    for(const t of toLoad){
      el('#status').textContent = `Loading roster for ${t.name}...`;
      try{
        const players = await fetchRosterForTeam(t.id);
        // fetch basic season stats per player (sequential per team but parallel across teams is OK)
        for(const pl of players){
          el('#status').textContent = `Getting stats for ${pl.person.fullName} (${t.name})...`;
          const stats = await fetchPlayerSeasonStats(pl.person.id);
          pl.stats = stats;
          allPlayers.push(pl);
        }
      }catch(e){
        console.warn('Failed roster for', t, e);
      }
    }

    // optionally fetch external fantasy ranking JSON
    let externalRankings = null;
    if(rankingUrl && rankingUrl.trim()){
      el('#status').textContent = 'Fetching external rankings...';
      try{
        const rdata = await fetchJSON(rankingUrl);
        // expect array of {playerId, rank} or object; normalize
        externalRankings = {};
        if(Array.isArray(rdata)){
          for(const it of rdata){
            if(it.playerId) externalRankings[it.playerId] = it.rank;
            else if(it.player_id) externalRankings[it.player_id] = it.rank || it.position;
          }
        }else if(typeof rdata === 'object'){
          // object mapping playerId -> rank
          for(const k of Object.keys(rdata)) externalRankings[k] = rdata[k];
        }
      }catch(e){
        console.warn('Failed to fetch external rankings:', e);
        externalRankings = null;
      }
    }

    el('#status').textContent = 'Computing ratings...';
    await computeRatings(externalRankings || null);
    el('#status').textContent = 'Rendering...';
    renderTeams(filterTeamId);
    el('#status').textContent = 'Done';
  }catch(e){
    console.error(e);
    el('#status').textContent = 'Error: ' + (e.message || e);
  }
}

async function init(){
  try{
    const teams = await loadTeams();
    el('#applyBtn').addEventListener('click', ()=>{
      const teamId = el('#teamSelect').value;
      const rankingUrl = el('#rankingSource').value.trim();
      mainLoad(teamId, rankingUrl);
    });
  }catch(e){
    console.error('init error', e);
    el('#status').textContent = 'Init error';
  }
}

init();
