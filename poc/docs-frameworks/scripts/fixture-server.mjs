import http from 'node:http';

let forceStatus = 0;
const titles = { ko: 'PoC 행사', ja: 'PoC イベント', en: 'PoC event' };
const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'OPTIONS') { res.writeHead(204).end(); return; }
  const url = new URL(req.url, 'http://127.0.0.1:4310');
  if (url.pathname === '/__poc/status') {
    forceStatus = Number(url.searchParams.get('next')) || 0;
    res.end(JSON.stringify({ forceStatus })); return;
  }
  const send = (status, data) => { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' }); res.end(JSON.stringify(data)); };
  if (forceStatus) { const status = forceStatus; forceStatus = 0; send(status, { success: false, error: status === 429 ? 'RATE_LIMITED' : 'VALIDATION_ERROR' }); return; }
  if (url.searchParams.has('country') && url.searchParams.get('country').length !== 2) { send(400, { success: false, error: 'VALIDATION_ERROR' }); return; }
  const locale = ['ko','ja','en'].includes(url.searchParams.get('locale')) ? url.searchParams.get('locale') : 'ko';
  const event = { id: 'poc-1', slug: 'poc-event', title: titles[locale], locale, countryCode: 'JP' };
  if (url.pathname === '/v1/events') { send(200, { success: true, data: { count: 1, items: [event] } }); return; }
  if (url.pathname === '/v1/events/poc-event') { send(200, { success: true, data: event }); return; }
  if (url.pathname.startsWith('/v1/events/')) { send(404, { success: false, error: 'EVENT_NOT_FOUND' }); return; }
  if (url.pathname === '/v1/calendars/custom.ics') {
    res.writeHead(200, { 'Content-Type': 'text/calendar; charset=utf-8' });
    res.end(`BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//SCLS//Docs PoC//EN\r\nBEGIN:VEVENT\r\nUID:poc-event@scls.invalid\r\nDTSTAMP:20261024T000000Z\r\nDTSTART:20261101T000000Z\r\nSUMMARY:${titles[locale]}\r\nEND:VEVENT\r\nEND:VCALENDAR\r\n`); return;
  }
  send(404, { success: false, error: 'NOT_FOUND' });
});
server.listen(4310, '127.0.0.1', () => console.log('Fixture API http://127.0.0.1:4310 (synthetic data, local only)'));
