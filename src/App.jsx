import React, { useState, useMemo, useContext, createContext, useRef, useEffect } from "react";
import {
  School, Users, GraduationCap, Wallet, MessageSquare, Megaphone,
  LayoutDashboard, UserCircle2, ClipboardList, CalendarClock,
  ChevronRight, Plus, Pencil, Trash2, Send, Stamp, BadgeCheck,
  LogOut, ShieldCheck, KeyRound, Bell, CircleUserRound,
  FileText, Inbox, CheckCircle2, XCircle, ArrowLeft, RefreshCw, Settings
} from "lucide-react";

/* ------------------------------------------------------------------
   CONNEXION SUPABASE — projet "CSP-SAGESSE DIVINE-TCHAOUROU"
   Appels directs à l'API REST (PostgREST) via fetch — aucune librairie
   externe requise, uniquement des fonctions déjà natives du navigateur.
------------------------------------------------------------------- */
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

async function pgFetch(chemin, options = {}) {
  const reponse = await fetch(`${SUPABASE_URL}/rest/v1${chemin}`, {
    ...options,
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  if (!reponse.ok) {
    const texte = await reponse.text().catch(() => "");
    throw new Error(`${reponse.status} ${reponse.statusText} — ${texte}`);
  }
  if (reponse.status === 204) return null;
  const brut = await reponse.text();
  return brut ? JSON.parse(brut) : null;
}

const pgSelect = (table, requete = "") => pgFetch(`/${table}?select=*${requete}`, { method: "GET" });

const pgUpsert = (table, lignes, onConflict) => {
  if (!lignes || lignes.length === 0) return Promise.resolve();
  const qs = onConflict ? `?on_conflict=${onConflict}` : "";
  return pgFetch(`/${table}${qs}`, {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify(lignes),
  });
};

const pgInsert = (table, lignes) => {
  if (!lignes || lignes.length === 0) return Promise.resolve();
  return pgFetch(`/${table}`, {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify(lignes),
  });
};

const pgDeleteIn = (table, colonne, valeurs) => {
  if (!valeurs || valeurs.length === 0) return Promise.resolve();
  const liste = valeurs.map((v) => `"${String(v).replace(/"/g, '\\"')}"`).join(",");
  return pgFetch(`/${table}?${colonne}=in.(${liste})`, { method: "DELETE", headers: { Prefer: "return=minimal" } });
};

const pgDeleteToutes = (table, colonneCle) =>
  pgFetch(`/${table}?${colonneCle}=not.is.null`, { method: "DELETE", headers: { Prefer: "return=minimal" } });

/* ------------------------------------------------------------------
   DONNÉES DE DÉMONSTRATION
------------------------------------------------------------------- */

const LOGO_CSP_BASE64 = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBAUEBAYFBQUGBgYHCQ4JCQgICRINDQoOFRIWFhUSFBQXGiEcFxgfGRQUHScdHyIjJSUlFhwpLCgkKyEkJST/2wBDAQYGBgkICREJCREkGBQYJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCT/wAARCAD7ASwDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD6nooooAKKKKACiiigAooooAKKKKACiiigAooooAKKZ50Xm+T5qebjOzcN2PXFYsXjzwtPrK6JFr+nSakzmMWqzAybx1XHrweKqMJS2QnJLc3aK5Txv8UPDHw9kt4devJYprlS8UUULSMyg4zx059am8V+PdN8H+FE8S6jb3ptH8r90kY81d/TKkjB9eatUKj5bRfvbeZLqRV9djpaK8Wf9qzwcudul623/bOMf+z163oerQ69o1jq1ujpDewJcIr43KrKCAcd+authK1FJ1Y2uTTrQqaQdy9RQSACSQAOSTXlms/tJeBNH1N7BZb++8ttrz2kIaIHvglhu+o4qaOHqVnanFsqdSMNZOx6nRWN4U8YaH420sanoV8l3b7tjcFWjbGdrKeQa07q8tbGPzbu5ht4+m+Vwg/M1nKEoy5WtSlJNXRNRUNreW19H5trcQ3EfTfE4YfmKmqWrDCiiigAooooAKKKKACiiigAooooAKWkooAKKKKACiiigAooooAKKKKACj3ryab9obRz8QbfwnBp83km8aynvpnCqsmSo2qM5G7AySPpXKftVS65pzaPc2mp30WmXSPBNbRTMsZkX5gSB1JBPX+7XfRy+pKrGlU93m1RzTxMVBzjrY9x/wCEo0EXosf7b0z7WTtEH2pPMJ9Nuc5rjPif8ZLf4aarp2nz6NPd/bVEgnEoREXdtbsSSOuPcV4d4/8AhJ4c8J/DvTfE+n6/cXF7e+TJHDMUXzVcZO1RyCvXOTWh8SYb/wATfAnwb4m1BpJby0le2klflpI2LKrE/wDbNefeu+jl1DnhLm5otuL0trY554qpaStZpX76H1MrK6hlOVYZBHcV8w/GW/8AFV38Xx4Vh8TX9jp+ovbi3UTskUQkAU5CkZG4Gvdvhbrn/CRfD3QdRLZke0SOT/fT5G/VTXhv7V+meT4o0PUwCq3No0LMOoKPn+T1jlUOXFulLfVfNf8ADGmMleipryO1+FfwrsfAXjAX0/ji11TVJreSD7Em0M4OGJ5cscbc9Kz/ANoL4VSz58eeGlaDUrLEt6kPDSKvImXH8a459QM9uV8GfDf4d/DPWbHxHdeOkkvYlJjSW4ijVt6kcoMseG9a0v2lfHZ0DwnH4fspsX2s/K4Q/MtuPvf99HC/TdWsKlWWNhKlJyvpdqyt107WIcYKg1JWt53PM/hwmo/G34r2+reIXili06COeZBwrCPAVQv+053H6mvX/wBpJd3wqvva5tz/AORBXiur+BPFPwTTw5410+VyXiQ3ikcQStyYXA6oy4GfUH2r074oeNtM+IXwFvNa0uQBTLAJ4WPzQSCRdyN+fB7gg104mPNiaNWk7000lbpqZUnalOE/itc8z8E/Fnwh4Y8M2em6j4AtNWvbcP5l26xZkyxI6oTwCB+FfVmizQ3OjWE9vbrbQy28bxwoABGpUEKMccDivl34efHix8E+E7PQ38JjUJbcyE3HnKu/c5bpsJ4zjrX0l4I8Sf8ACYeFdO10Whs/tsZfyC27y8MRjOB6elcmcUpRlzclld63vf5dDXAzTVua+na1iz4o0+51bw1qun2cnl3N1ZywxPnGHZCBz25NfJ/w31jw14B1XUtB+IvhJZTMwRpp4A8lrjII2nnaeu5efrX018TPGU/gPwhea3bWEl9cRFUjiCkqCT95yOijufp614Z8R/jR4G+IfgeWG60G5TxDsAt2aNSLd8jJEoOSvXjHPpTyqNRwcORuEna6dmn3DFuKkne0l36nr9rfeE/hp8MLrWfDSxS6PFG93CY5N4ndzhRu6/eIXnkAY7V4f4Q+Hnin4+3V14l8Qa69vYrKYlcpvyw5KRJkBVGRz/Pmtnw14W1q/wD2ZNXgeKbMlw19aQ4O5oUZGOB6Ha5Hr+NdJ+zX4+0M+D08NXV9b2mo2k0jrHM4TzkdtwZSepBJBHXitkpYelVqUnzTUrX3aXchtVJwjPSNr28xPCHwC1rwF460vUtK8RyT6OrM12ozC5AU4VlBIdScD2rovin8dtJ+Hdz/AGXa2x1TV9oZ4Q+yOAHpvbnk/wB0fpXotvq1hd3Elva3ttcTxKHeKKVWZQehIB4zXzT8CNLtfG/xV13XNbjW5nt/Mu0ilG4CVpMBsH+6OB6celc1GX1lyr4rVQXpfsazXsrU6OnM/uNC1/ai8SWU0U2t+EIVsZTw0XmRMR/sl8hq918HeMtH8daJHrGjTmWBiVdGGHicdVYdjV3WtE0/xDpdxpeqWsdzaXCFHjcZGPUehHY9q+df2Xryex8ceIdFgmaSwMDP7Fo5Qqt+IY1MoUMTQnUpw5ZQt1umhqVSlUjGTumfTFFfOOu+Ktc8YftDW2k+H9WvbSzs5Us5fs8pVWjjy8xI6HncvPoK+jq4sThXQUeZ6yV/Q6KVVVL26OwUUUVymoUUUUAFFFFABS0lGaACiiigAooqO5uYbO3lubiVYoYkMkkjnARQMkk+mKAJKMV836/8bfG/xB1ybRfhtYTRW0ecTxxhppFzjexb5Y1Pbv79qyrvx58ZfhTdwXXifz7uzmbGy72SxSd9okTlWx7/AIGvVjlFVqzklJ9G9TjeNgtk2u/Q7z49/FbxX8P76wstFt7SC2u4vNW9kTzGLK3zIFPA42+vXtVr4eftF6F4msmt9dMWk6tFGzbWb9zcYGfkY9Dx90/gTUXxFWw+NPwZ/wCEg0iJjc2WbuOI8vE6DEsR/wCA5+uFNebfDz4aaJ8XvA8iW00el+JtIfymmUZjuYjzGZF9eq7hz8vOa66VDDSwv76PLKLs2t16+XQxnUqqt7jumrpHna6JqOt6JrXi6IsI7O9i84jqDMWO7PsQv/fQr6C8VXa/Fj9nn+1owJtQsYluJQOqzQ8S/mu4/iK0fhX8JbrSfhrr3hjxJAsVxqlxMjlWDjZtVUdSPcbhWN+zx4X8U6CviLQdf0e4h0a43KJZflV5QSj7QeSrL3Ax8orbFYyFW84tXpyTXmjOlQlC0WtJLX1OP+Bnwm8P/EfT59U1vUL6drCcQGxRtq7NoK5bk4PIwMdK9x+J/hW31H4WaxolhapFHb2e62hjXhDFhlVR/wABx+NUvhP8IYvhcdQePWZ79r7aGjMYSNApO0gcknBxnP4V6HXm47HOeI54SvFO6OvD4dRpcslZvc+UPAL/ABoTw3FoPhfTryy07e8i3E0CxEbjk4eTtn0HevTvEHwf8Q/EDwN4b03xHrMNvrWmySNcXWDP5qtnvxlsBfyr2GilWzOcpqdOKi73ulqOGEio8sm2jxHSv2UvC9qQ2o6zqt4e4j2QqT+RP616HqHwu8J6trsGu6lphvdQt1jSKSeZ2CBPu/Lnb156ckmurormqY6vUd5zZpHD04qyiQ3tla6jbSWt7bw3VvIMPFMgdG78g8GobfRtMs4Gt7bTrKCFiC0ccCqrEdCQBg1cormu7WNbIhWytU+7bQL9IwKmACjAAA9BRRSuxiMAylWAIIwQehFc3J8NPBUt99ufwrozXGd2/wCypyfXGMV0tFVGco/C7CcU90IqKiBFVVUDAUDAA9K8h8Zfsz+FvEt/Lf6bdXGiTTMXkjgQPCzHqQhxt/A49q9forWhiatCXNSlZkVKUKitJXPO/hR8HLX4WzX88WrTajNeoiNvhEaoFJPABPr615Z418FeL/hD48uPGfg61kvNMuXeR1SMyCMOcvFIg5255DDpx0Ir6XoropZhVjUlUn73No0+pnPDQcVGOltj5i1n9ojxj4u06TQ9C8NNZ310vlNLbb5pQDwdi7RtPuc4/Wut+HPgyX4I/D3XfFuuCMavLbb/ACQc+So+5GT3YuRn8B2r29UVSSqqpPUgYzXNfEPwPb/EPw3Jodzf3NjG8iy+ZAASSvQMD1GeccdBWzx1OSVGMOSDa5urZn9XknzuXNJbHjv7LHhqW7u9a8ZXmZHdjaQu3VnJDyt/6CPxNfRFfNq/Cb4sfDCfzfBmtDUbIyZMMTBQc92hfKn3IJNa/wAZfjHqllLH4F8NGSbXJVSC9uoYyGDsACkI9Se/btzyNsXh3i8RzUZJp/gl37EUaio0rTTTX4ln4y/Gya2uH8HeCme51aZvIuLm3+Ywk8eXHjq/qf4fr0T9mTxj4j8SR6zYazqc1/bWCQ+QZ/mkQsWyN/UjCjrmvM/BGrD4OapqSeLvCV9DqlzA8drfPyYcqR8oPysCerBs4r0D9km326X4kuTyWngjz9FY/wBa68VhqdHBzjGOitaWmrb1sY0qsp14tvvp2Pf8jHNFeCftLfEGeFLXwPo0jtd3TJLd+STvAJ/dxDHdjg/QD1r0vwy0/wAPvhvbz+LtXmuZrG2867uJ23spPPlg9WxkKO5NeLPByjRhUb1k9F19TujXTm4Lp1OworI8LeLNG8Z6THqmiXsd1bvw2OHjb+669VPsa165JRcXyyVmbJpq6Cj8KKKQwoory79ofxrdeEPA3kafK0N5qsv2VZVOGjTaS5B7HHH/AAKtqFGVapGnHdkVJqEXJ9DW1f42+CdH8RW+gSap595LMsDtAu6KBicfO/Qc9cZx3qv8f7m6tvhPrbWgbLiKOQr2jaRQ36cfjXHfBX4G+Hj4ZsvEPiOyj1S9v4xPFDNzFBGeV+XozEcknPWvZtZ0Sx17RbvRr2LfZXUJgkRePlIxx6EdvpXXV+r4evH2V3yvW/Wz6GEPaVKb59L7Hln7Llvp6fDyWa2EZvJL2QXTD72RjYD7bSCPqa7j4p2Wn33w88QR6mIzbrZSSZf+F1UlCPfcBivnxvCfxO+Beu3Nx4dguNQ0yU/6yCEzxToOnmRjlWHrx7Gp9SvPi/8AG3y9Jl0qTTtMLAy5ga2gOO7s/wAzY67Rn6V6FXB+0xH1mNRcjd731Rzwr8tP2Ti+bY6r9kxp5fD/AIiglBa1+0xFQ33dxQ7h+QWtT4ZfCDxB4C+Jer6pBNaw+HZfMiijL7pJo2O5MAdNp4yfQ+tehfDzwNY/Dzwxb6JZOZWUmSecjBmlP3mx2HAAHYAV0tcGJx7lVqun8MzopYdKEFLdBRRRXmnUFFc54n+InhXwarf21rdrbSgZEAbfKfoi5P6V5N4j/au0+EvF4d0Ge6I4E96/lr/3yuSfzFddDAV6/wDDi7fgY1MRTp/Ez3ymTTRW8ZkmkSJB1Z2Cgfia+O9d/aF+IGtllj1WPTYm/gsYghH/AAI5b9a4TUdc1XWHL6lqd7eseSbidpP5mvWpcPVXrUkl+P8AkcU8zgvhVz7a1T4oeCdGyL3xRpSMOqpOJG/JcmuV1D9pP4e2JIivb6+I/wCfe1bB/FttfIQ4orvhw9QXxyb/AAOeWZ1HskfT13+1f4djz9l0DVZh2Mjxx/1NZFz+1sckWvhIexlvf8Er54orpjkmEX2b/NmLx9d9T3iT9rLWSf3fhnT1H+1cOf6CoT+1h4jzx4e0jH+/J/jXhuaM1p/ZGE/k/P8AzJ+u1/5j3VP2sdeH3/Delke0sgq1D+1rfj/XeFLVv9y8YfzU14BmkoeUYR/Y/F/5h9dr/wAx9I237Wtg2PtXhS6T1MV0rfzUVtWP7U/gyfAurDWbQnqTEjgfk2f0r5UpaxlkeEeya+ZazCsup9n6d8evh1qWAviKO3Y/w3MTx/qRj9a63TPFGg60AdM1rTr3PQQXCOfyBr4DoUlGDKSrDoRwRXLU4dpP4Jteuv8AkbRzSf2on6H0V8KaJ8SPGPh0j+zPEmpQoOkbTGRP++WyP0r0bw9+1N4osCsetadYarGOroDBKfxGV/SvPrZBiI6wal+B1QzKm/i0PqWqk+kadc38GozWFrLe24IhuHiUyRgjB2tjIrzfwx+0d4H1/ZFe3E+i3DcbbxP3efZ1yPzxXptne2uoW6XNncw3MDjKywuHVvoRxXk1aFWi7VItHZCpCorxdzn/AIl6HL4i8Dazp9rYQ315LauLaKQKf3mOCC3AI7GvKfg9ev8ACf4X+JNW8R2U9lPBfsBbzoUeVxGgRRnrknqPc175WT4o8KaN4z0l9K1yyS7tWO4Akgo3OGUjkEZ61rQxSjT9hNe62m++hFSjeXtI7pHgPwD8JXvjrxjf/ETxBmdIZ2aEuOJLk9x/soCMe+PSqXxs8eXPxL8X2fgbw7PGbGK6WFpDIFjuLjOMk/3E5x6nJ9K9R+JFjqvw++E50bwJpk8kcSeRJLEd0tvCcl5MDlmPOSOmSe1eA+Mfho/gb4caJrGpI66xqt2XMZJH2eERkqhH94nBPpwO1e5hJwr1vrEn/dgu3nb+vyPPrRlTp+zXq2dF4w8Lax+znrmka3oWuNcw3gKSwSDb5rIAXVlHDIc8HqP1r6i0nUE1fSrLUYlKpdwRzqp6gMoYD9a+cvDX7P3iLxoNG1jxR4mF1pUlvFMsZlklnETAN5Y3cL6Egmup+OnxcXwjZL4P8Ky7NUdFjlkhPNnHjARcfxkYx6D3IrlxdP61OFGEuaet3a2nn6G1GXsYynJWj0R7dS14h8Ivjs2pXEfhXxrmy1qM+TFczLsE7D+CQH7sn6H69fbq8jE4aeHnyVF/wTtpVY1I80Qryf8AaS8IXfibwKl5YQtNcaTN9paNBlmiKkPgd8cH6A16xR1pYes6NSNWO6HUpqcXF9TwP4LfHjw/Z+F7Pw/4nvf7PubBPJhuHUmOaMfdyQDhgOOfSoPjD8fbO/05fD/ga8uJ7y4kQSX1urLtAIISPuWJwMgdPXNdr4n/AGd/A/iS/kv1t7rS55W3SfYZAqMe52EED8MVpeCvgp4O8C3S31hZSXV8nKXV4/mPGfVRgBT7gZ969V18Ap+3UW5b8vS5xqniOX2bat36nReCjrv/AAiumHxK0bawYFNzsXaAx7Ef3sYzjjOa2qKK8aUuZtnclZWCiuc8bfEDw/4A077Zrd4I2YHybdPmmnPoq/1OAPWvl74ifHrxL44aWzs5G0fSWyv2a3f95Kv/AE0fqfoMD613YLLa2Kd4q0e7/rU56+KhR337Hvvjr48+EvBRktUuDq+orx9ms2BCH0d+i/Tk+1eA+Mvj/wCM/FheGC7GjWTZHkWJKsR/tSfeP4YHtXmg4pa+qwuUYehq1zPu/wDI8etjalTS9kK7tI5d2Z2Y5LMckn3NNqzp2m3ur3aWenWk95cycLDBGXY/gK9b8JfsxeKdZEc+u3Nvolu2CYz+9nI/3QcD8T+FdlfF0aCvUkl/XYwp0Z1H7queOVa0/Sr/AFeXydOsbq9k/uW8TSH9BX1z4a/Z58CeHwjz2Emr3C8+ZfPuXPsgwv5g16LZafZ6ZALextLe1hHSOCMIo/AV4tbiGmtKUb+uh308sk/jdj420f4D/ELWcMugPaIf47yRYsfgTu/Suy039lHxFNtOo69pdoD1EKPKw/PaK+nqK82pn2Jl8Nl8v8zqjl1Jb6ngtn+yZpKAG98T38vqIbdI/wCZatu2/Zd8DQgedPrNwf8AauFUfoor1+iuSWaYuW9RmywlFfZPL4/2bvh2g5069f8A3rx/6Gph+zr8OOn9izH/ALfJf/iq9KorN4/E/wDPx/ey/q9L+VfceYv+zh8On6aVdJ/u3kn9TVSb9mPwBLnYmqxf7l3n+YNes0U1mGJX/Lx/eL6tS/lR4ld/speFZcm11rWYD/tGNx/6CKxL79kngmw8WHPYT2f9Q39K+iKK1jm2LjtP8iHgqL+yfKWo/steNLUE2d7o96B0AlaNj/30uP1rkdX+DHj/AEQM1z4ZvZEXq9ticf8AjhJr7borrp5/iY/EkzGWW0ntdH563VrcWMphu7ea3lHVJUKMPwNQ5r9BNS0bTdZhMOpafaXsePu3EKyD9RXnXiT9nHwLroZ7S0n0ac8h7KT5M/7jZH5Yr0aPENOWlWLXpqctTLJL4Hc+Qa1/Dni7X/CNz9p0LVbqxfOWWN/kf/eU/KfxFekeLv2ZvFmhK9xossGu2y5OyIeXOB/uE4P4H8K8mu7S50+5ktby3mtriM4eKVCjqfcHkV7FKvQxUfcaku3/AADhnTqUXqrH0L4G/alSQx2fjKxEfQfb7NSR9Xj6j6rn6V7vo+tab4gsI9Q0m+gvbWQfLLC4YfQ+h9jzX5+1v+D/ABzr3gXURfaHfPbkkeZCfmimHo69D9eo7GvJxmRU53lQ919un/AO2hmMo6VNUfeFedfG34ZXfxL8PW0Gn3kcF7YSNNDHKPkmJXG0n+H2NHws+NGj/EeEWkgXT9bRcvZs3EuOrRn+Ie3UfrXotfNfvsJWTatJHre5WhpqmeQeOviWfhN8O9G0dBH/AMJM+nwwx25IYW5VArSNjsCCB6n2BrxGy8EeO9L0mz+KKWn2srcm7ImXzZSM5850PVCc89R14GDX018SvhbovxK0vybxBbahEp+zXyL88R9D/eX1B/DFea/B9viB4G8YN8P9Y06S/wBJCNKJySY4I/78bnqhPGzrk9ua9bB4mEMPKVK3PvJPqvI4q9KUqiU/h6W6PzOg0Hw14V+Oun6R421XQprG+gl2zqvyx3mzsT/HHnGDweCK9dAAAAAAHAFR29tDZwJb20McMMY2pHGoVVHoAOBUleLXrOo7L4Vst7I7qcOVefUKKKKxNAooooAK8r+Lvxy0/wAApJpWleVf68wwUJzHa57vjqfRfzx3o/HP41DwZA/h7QZVbXJk/ezDkWSEdf8AfI6Dt19K+VJZZLiV5ppHllkYs7ucsxPUknqa+gyrKPa2rVvh6Lv/AMA83GY3k9ynuXNc13U/EupTanq97NeXcxy0khz+AHQAeg4qhS1u+DfBOtePNZTStFtvNk+9LK3EcCf3nPYfqe1fVylClC70SPGSlOVt2zEhhluZUhhjeWWRgqIilmYnoAB1Ne3/AA8/Zm1LVxHqHi6Z9MtThhZRY+0OP9o9E/U/SvYPhr8G/D/w6gSeOMX+rsuJL+ZeQe4jH8A/U9zXfV8vjs9lK8MPou/X5Hr4fLkveq/cY3hnwdoPg6yFnoWl29lHj5mRcvJ7sx5Y/U1s1y/jT4leF/AMG/W9SRJyMpaRfPO/0UdB7nA964vwx8S/GfxRumbwtolvomho219V1EGVz6iNAQC34kDua8ZYetVi60tu7/rX5Hc6sIPkW/ZHrlFRWsUkNvHFLO9xIqgNK4ALn1IAAH4VyfxD+Kvh74cWoOozGe+kXMNjAQZZPc/3V9z+Gaxp0pVJckFdmkpqK5paI7HFcz4j+Jfg/wAJsyavr9lBMvWBX8yX/vhckV8teN/jt4w8ZvJCt42k6e3AtbJiuR/tP95v0HtXnZ5JJ5J5J9a+hw3D0mr15W8l/meZVzNLSmj6n1X9qjwlaErp+m6rfkfxFViU/mc/pWBcfta8/wCj+EuP+ml7z+iV870V6cMkwkd43+bOSWYVn1PoFf2tbzPzeE7cj2vT/wDEVbt/2tYTj7R4SkHqY70H+aV86Umat5Ng39j8X/mSsfX/AJvyPqOx/as8Kzf8fmj6va+pURyD/wBCFex6Zfw6rp1pqFvu8i6hSePeMHawBGR2ODX58N90/SvvfwT/AMiboH/YOtv/AEWteFnGX0cNGLpdT0cDiZ1W1PoeReJv2nm8PeItT0ceFxOLG5kt/N+2bd+1iM42cdKzP+Gtm/6FEf8Agd/9hXjvxLP/ABcTxL/2Erj/ANDNc3XsUcowkqcZOGrS6v8AzOGpjayk0mfQ3/DWzf8AQoj/AMDv/sKX/hrZj/zKI/8AA7/7Cvniitf7Gwf8n4v/ADI+v1/5vyPoqP8Aa1Td+98Itj/Zvef/AECtrTf2qvC1wwXUNI1ayz1ZQkqj8iD+lfLeaKiWSYR7Rt82NZhWXU+4/DnxW8F+KnSLTPEFm079IJm8qQn0Ctgn8M1a8Y/D7w547tPs+uadHM4GI7hPlmi/3XHP4HI9q+Ecd69C8CfHHxb4IeOH7W2qaavBs7xiwA/2H6r+o9q86tkU6b58NPVd9/vOqnmMZe7ViXPij8C9b+H4k1GzZtU0QHJuEX95AP8Apoo7f7Q4+leZV9xeAviP4f8AiZpUk2nOPNVdt1YzgeZFnjkdGU+o4P6V4D8e/g2ng6c+JNAhI0a4kxPAoyLOQ9Mf7BPT0PHcV05fmk3P6viVaX5/1+JlicHFR9rS1R5Ba3dxYXMV3aTSQXELh45Y22sjDoQR3r64+CPxfT4g6cdM1Rkj16zTMgHAuk6eYo9f7w/HoePkIVo+HPEF94V1yz1rTZPLurSQSIezDup9iMg/Wu/McBHFU7faWzOfC4l0ZX6dT7+orL8LeIbTxZ4esNcsj+4vYRIFzkoe6n3ByPwrUr4GUXFuL3R9GmmroKKKKQwooooAK4v4tfEOH4c+FJb9dj6jcEw2UTfxSEfeI/uqOT+A712lfGHxx8ct428dXRhl3adpxNpagHghT8z/APAmz+AFellWD+s1kpfCtX/kcuMr+yp3W7OEvb251K8nvbyd57mdzJLK5yzsTkk1DRQAWICgkk4AHUmvvEklZHzj1N3wX4O1Px34gt9F0qPMsp3SSsPkgjH3nb2H6nAr7S8DeB9I8AaFFpOkxYAw007D95cP3Zj/ACHQCuc+CPw3j+H/AIUja6iA1jUAs12xHKcfLF9FB59ya9Er4nNsxeIn7OD9xfj5/wCR7+CwqpR5pbsR3SJGkkZURQWZmOAAOpJr54+K/wC0iyPNo3giQcEpLqpGfqIgf/Qj+HrWN8fvjLLrl5ceE9AuSulwMUvJ42/4+nHVAf7gP5n268P8IPh3J8RvFsdjKHXTbUCe9kXj5M8ID6sePpk9q7MBllOlT+s4rZa2/wA/8jHEYuU5eyo/edZ8HPg5efEa8PifxTJctpPmFh5rky37g8/Medmep79B619T2dnbafaxWlnBFb28KhI4o1CqijoAB0pbS0gsLWG0tYUgt4UEccaDCooGAAKlryMbjZ4mfNLRLZdjtoUI0o2W5w3xe+JUPw28Mm6jVJdTuyYrKFuhbHLt/sr19yQO9fGeq6tfa5qE+palcyXV5cMXklkOSx/w9u1ei/tHeIJda+Jl3aFyYNLiS1jXsCQGY/XLY/AV5hX1eT4ONGgp296Wv/APGx1d1Kjj0QldD4N8A+IfHt61poVg0+zHmzOdsUX+8x/l19qwEQyOqLgFiFGfevvLwX4VsPBvhqx0bT4kSOGMeY6jBlkI+Zz6kmqzXMHhILlV5PYWDw3tpO+yPFtC/ZNiCK+veI3L94rGIAD/AIG+c/8AfIrrLb9mPwDAAJRq1wfWS6x/6CBXrNFfK1M0xU3dzfy0PYjg6Mfsnlx/Zt+HZGPsF8PcXj/41UuP2YPAUoPlvrEB/wBi6B/9CU165RWazDEr/l4/vK+rUv5UeFX37J2gyg/YvEWp257ebGkg/TbXtOiacNH0ew03zPN+x28dv5mMb9ihc47ZxVygVFfGVq6SqyvYqnQhTd4Kx8KfEv8A5KJ4l/7CVx/6Ga5uuk+Jf/JRPEv/AGErj/0M1zdfoGG/hR9F+R81V+N+pr+ENFi8R+KtI0aeWSKK+u47d3jxuUM2CRnjNfQ//DJ/hof8x/WPyj/+Jrwj4X/8lH8M/wDYSg/9DFfdB614Gd4ytQqRVKVk0ell9CnUg3NXPCbj9k3Q3Qi38SanG/YyRRuPyGK4/wAQ/sseJ9OjaXRtTsdWC8+UwMEh+mSVP5ivqaivJp5zi4O/Nf1O2WBoyW1j8+9W0fUdBvpLDVLKeyu4zhopkKsPf3HuKpivuD4mfDfTPiNoMtndRImoRITZ3ePmhfsCe6nuP618S3VrNY3c9pcIY5oJGikU/wALKcEfmK+py3MY4uD0tJbo8fFYV0X5Mv8AhfxNqXg/XLbWtJnMV1btn/ZkXujDupHUV9raNqekfFHwLHcmISWGq2xjmhbkxk8Mp91OefYGvhWvo/8AZO1ySSy17Q5HJSF47uJT/DuBVsf98rXHnuGUqXt4/FH8jfLqrU/ZvZngninw9ceFPEmo6Hdcy2U7Rbv76/wt+IwfxrLNev8A7UOlJY/ESG8QYN9YxyP7spZM/kFryDNerg63tqEKj6o469PkqOJ9Ofsp+IHu/DeraHK2fsFws0QPZJAcj/vpSfxr3OvmX9k1n/4SXX1Gdhsoyfr5nH8zX01XxmcQUcXO3k/wPdwMm6MbhRRRivMOsKKKKAOS+K/iVvCfw+1rVI32TrAYYD3Ej/IpH0Jz+FfDY96+pP2rNSa38GaXp6nAu77cw9QiE/zYV8t19lkFJRw7n1b/ACPDzKd6nL2Fr0X4CeE18V/EayFxHvtNOU30wI4JUjYD/wACK/ka86r6P/ZL0tV0/wAQ6qR87zRWyn0CqWP/AKEPyrszSs6WFnJb7fec+Dp89WKZ9A15t8fPHUngrwNKlnKY9R1NjaW7A8oCMu4+i8D3Ir0mvlb9qjWHvPHNjpgY+VYWStt7b5GJJ/ILXyWVYdVsTGMtlr9x7WMqOnSbW54vX2D+zr4UTw78Ora9eMC71djdyN32dIx9Noz/AMCNfHx+6fpX394XtksvDOk20QxHDZQoo9ggFe7xDVcaUYLq/wAjz8sgnNy7GnRRRXyJ7R8WfHXTpdO+KuvCUHE8qXCH1VkU/wA8j8K4OvqX9o74Y3HifTYfE+kQNNqGnRlLiFBlpoOuQO5U5OPQn0r5ZBzX32V4mNbDxtutH8j5zGUnTqu/UPxxX1h8Ivjto3iTS7XR9evI9P1mBFi3zsFjusDAZWPAY91PfpXyhRjIrTHYGni4cs9GtmRh8RKjK8T9DwQQCCCDyCO9FfC3hr4leL/CIVdH168ghU5EDt5kX/fDZH5V6f4d/at1i2Kx+INEtb5O8toxhf64OQf0r5mvkOIhrC0vwPWp5jSl8Wh9NUV5z4Z+P3gPxIViOpnS7hsDytQXyufZ+V/WvRIZY54llhkSSNxlXQghh6givIq0KlJ2qRaO2FSM1eLuOoFFA61kWfCfxL/5KJ4l/wCwlcf+hmubrpPiX/yUTxL/ANhK4/8AQzXOV+k4f+FD0X5HytX436nT/C7/AJKP4Z/7CUH/AKGK+6TXwt8L/wDko/hn/sJQf+hivuk18vxF/Fh6fqevlnwS9RKKKK+ePTFFfCXxImhuPiB4jltypibUZypXofnPP519RfGX4uWHgHR57CyuI5dfuYysEKnJgBH+sf0x2Hc+2a+O2ZnYszFmJySepPrX1XD+GnFSrS0T0R4+Z1Yu0F0Er3P9k6J28Ua7KM+Wtiin0yZOP5GvDK+pf2W/C0uleE77XLhCr6rMBCCOsUeQD+LFvyr0M6qKGEkn1sjmwEW6y8jh/wBq6dJPGWkQKfmi0/LD0zI2P5V4jXc/GvxKnin4k6vdQvvt7dxZwkHgrGNpI9i24/jXF2dncahdw2dpE81xO6xxRoMl2JwAPxrfL4eyw0Iy7f8ABM8TLnqyaPoz9k3RXi07X9adCFnljtY2PfYCzf8Aoa17/XNfDnwhH4G8G6boalWmhj3TuP45W5c/TJwPYCulr4nH11XxEqi2bPfw9P2dNRYUUUZrkNgooooA+fv2t932Hwz/AHfNuPzwlfOFfUP7V2nPP4Q0i/Vci1vijH0Dof6qK+Xq+4yR3wkfn+Z8/mCtWYlfUn7KLKfBOrKPvDUTn/v2lfLlfQv7JesqsviDRXYbnEV3GPXGVb+aUZ3BywkrdLBgJWrI+i6+QP2k43T4q3jN0e1t2X6bMfzBr6/r5q/aw8PvDq+jeIUX91PC1nIR2dSWXP1DN/3zXz+RzUcUk+qaPSzCLdF26HgbDII9a+7PhprUfiDwDoOoRuG32caPg9HUbWH5qa+FK97/AGZPiPFp11L4N1KYJDdOZrB3OAJT96P/AIFjI9wfWvczzDOrQ547x1+XU8/L6qhU5X1PpWiiiviz3g6V5J8SP2d9D8ZTS6lo8i6Lqj5Z9qZgnb1ZR90+6/ka9borahiKlCXPTdmRUpRqK0lc+JPFXwb8beDy7XujTXNsv/L1Zjzo8epxyv4gVxfQkdCOCD2r9DxXN+Ivhv4R8V7jq+gWNxKf+WwTZJ/32uD+tfQUOIWtK0fmv8jzamWL7D+8+E80V9PeIf2VNAu90mhaxe6c55EVwBPH9M8MPzNeVeKf2fvHXhlXmjsI9WtU582wbe2PUocN+QNexQzXC1tFKz89DhqYKrDdXPNsV03hD4keKPA06vomqSxQ5y1rId8D/VDx+IwfeubYNG7I6lWU4ZSMEH0IpK7p04VI8s1dHPGUoO60Z9jfCn42aV8R0FhcIuna4i7mtS2UmA6tGT19weR79a9JFfnvp2oXWk39vqFjO8F1bSCWKVDgow6GvuT4deL08deDtN15VVJLiPbMg6JKp2uPpkEj2Ir43N8tWGaqU/hf4M9zBYp1Vyy3R8cfEv8A5KJ4l/7CVx/6Ga5uuk+Jf/JRPEv/AGErj/0M1zRNfX4f+FH0X5HiVfjfqa3hPW08OeJ9K1mSFp0sLqO4MStguFbOAe1e/wD/AA1rpZ6+Fr7/AMCU/wAK+aqKwxOX0MTJSqq7XmaUsTUpK0GfRl3+1tDsP2PwlIX7Ga8AH6JXEeJ/2kfG2vxvBZSW2iwMMH7IpMhH++2SPwxXlVFZ0sqwtN3UPv1/MqeMrSVnIknuJrqZ57iWSaaQ7nkkYszH1JPJNR1e0fQ9U8QXQtNJ066v5z/BbxlyPrjp+Ne2+AP2X767kjvvGdyLSDhvsFs4aV/Z3HCj2GT7itsTjaOGX7yVvLr9xFKhUqv3UeefCv4Xal8StaWKNZINKgYG8vMcKP7i+rn07dTX0r8VfGFl8LPh6YNOCW908X2HTYV/hO3G76KOc+uPWupkbw/8PfDLyBLbStI0+MsQgwqj+rE/iSa+V9fPjL9oDxdJf6VpNw1jGfJtg/yw20Wf4nPG49TjJ/IV88qrzCt7Sr7tKHf+t3+R6bgsNT5YazZ5iNztj5mZj9STX078AfgvJ4e8vxX4jt9mpOv+h2sg5tlI++w7OR0HYe543fhf8AdG8DPFqmqvHq2sryrsv7m3P+wp6n/aP4AV6tU5pnCqp0aG3V9/+APCYHkfPU3Ciiivnj0woopaAEooooA434weHG8U/DnW9PiTfOsP2iEdy8Z3gD64I/GviAHIr9EcZ68ivif4y+CH8C+Or2zjjK2F2TdWZ7eWx5X/AICcj8vWvpuHsSlzUH6r9TyczpbVF6HD11vwr8Yf8IN4603V5GItd/kXX/XF+GP4cN+FclQa+lq041IOEtmeVCTjJSXQ/Q6ORJY1kjZXRwGVlOQQehFcx8TfBUXj/wAHX2ittW4YebayN/BMvKn6HkH2JrzX9nH4qR6vpsfg7V5wL+zXFi7n/Xwj+D/eX9R9DXudfn9alUwdfle6en+Z9LTnGvTv0Z+et7ZXOm3k9leQvBc27mKWJxhkYHBBqJHeKRZI3ZHQhlZTgqR0IPY19U/HP4JHxir+I/D0SLrcafv7foLxQOMejgdPUcelfLE8E1pPJb3ETwzRMUeORSrIw6gg9DX22BxsMXT5o79UeBiMPKjKz2Ppj4Q/tD2mqwwaH4xuEttQXEcOoPxHcegc/wALe/Q+1e6KQ6hlIZSMgg8EV+eFd34F+M/i7wGEt7O9F7p6/wDLld5eNR/snqv4HHtXk47IlNueH08unyOzD5jyrlq/efatFeNeGP2oPCmqqkeuWt3o05wC23zoc/7y/MPxWvS9H8beGfECqdK1/Tbst0WO4Xd/3znP6V87Wwdej/Eg0epCvTn8LNqigc89aMGuY1CijBrD8Q+OfDPhWF5NZ1uxtCoz5bSgyH6IMsfyqowlJ2irsTkkrs8r/aW8AaRP4Yk8W29vHbanayxrNIg2/aEZguG9WBIIPXqK+X69b+NPxu/4WDGmi6NDLb6LFIJGeUYkuXHQkfwqOoHXufSvJK+6ymjWpYdRrb/kj57GzhOreAGvq39liaST4e3cbZ2R6lIE+hRCf1NfKVfZ/wABvDM3hj4a6bFcoUuLwteyIwwV3/dB/wCAha5s/mlhlF7tmuWxbq38j5V+Jf8AyUTxL/2Erj/0M1zWK6X4l/8AJRPEv/YSuP8A0M1zdeth/wCFH0X5HFV+N+pr+DtFh8R+K9I0e5kkihvruO3d48blVmwSM8Zr6LP7KPhbP/Ib1r84v/ia8E+F3HxH8M/9hKD/ANDFfdJ614Gd4ytQqxVKVro9LL6EKkG5q541bfsseComBmvtanA7GZFB/JK6TSfgL8PNIwy+H47tx/FeSvL+hOP0r0CivBnj8TPSVR/eejHDUo7RRWsNNsdKtxb6fZ29nAOkcEYRR+AFWaKK5G29WblLVdF0zXIY4dUsLa+hjcSpHcRh1DjocHjPNWoYYreJYYY0ijUYVEUKAPYCn0UXdrCt1CiiikMKKKKACiiigAooooAK4P4x/DaP4j+Fmt4Ai6rZ5mspG4y2OYyfRhx9QD2rvKK0o1ZUpqpDdEzgpxcZbH553VrPYXUtpdQyQXELmOSJxhkYHBBHrUYr6x+NnwRi8cRvr2hJHDrsafPHwq3ijoCezjse/Q+o+VLq0uLC6ltLuCS3uIWKSRSKVZGHUEHpX3mAx0MVDmjv1R85icNKjKz2EtLq4sLqK7tJpILiFxJHLG2GRgcgg+tfVvwf+PFj4yih0bxBLFZa6AEVzhY7z3X0f/Z79vQfJ1HQggkEcginjsBTxcLT36MMPiZUXdbH6H1wHxJ+DHh74jRtcyL/AGfq4XCX0CjLegkX+Mfr714n8OP2kNZ8MrFpviSOTWNOXCrPu/0mFfqeHH1596+jfCnjrw742tBc6FqkF1gZeLO2WP8A3kPI/lXyFbCYnAz51962/r1Pbp1qWIjy/gfIfjf4PeLPAbySX1g13YKeL60BeLH+13T8R+NcUD6V+h5AIIIBB4IPeuB8V/A3wP4tZ5p9KFhdvybiwPlMT6lfun8RXq4XiDTlrx+a/wAjjrZZ1ps+LqO+e47177r37J9/EWfQfEVvcL2ivYjGf++lyD+QrhNU+AXxE0snOgm7Qfx2kySA/hkH9K9mlmeFqfDNfPT8zgnhK0N4nHWXiXXNO4s9a1O2HpFdOo/Q1oj4keNFXavizXAP+v2T/Gq974H8U6cxF34b1iHHXdZyY/PFZ76VqEZw9heKfQwsP6Vvy0J66P7jO9SPcuXfjDxLfgrd+IdXnU9RJeSEH8M1kklmLMSzHqTyTV2HQ9WuCBDpd/KT2S3c/wAhW3pvwu8b6uQLTwtqzA/xSQGNfzfAp89Gmt0vuQcs59GzlqDxXsOgfsv+MdTZW1Wew0iE9Q7+dJj/AHV4/wDHq9i8Ffs++D/CEkd1cQvrN+hys14AUQ+qxjgfjk1wYjOcNSWj5n5f5nRSwFWe6sjyP4JfA688S3tv4h8R2r2+ixMJIbeUYa8I6cdo/fv0HHNfVIAXAAAA7CjgcDgUd6+SxuNqYqfPP5Lse1QoRox5Ynwp8S/+Si+Jf+wlcf8AoZrnK6T4l/8AJRPEv/YSuP8A0M1zRr73Dfwo+i/I+cq/G/U6f4YH/i4/hn/sJQf+hivug18L/C//AJKP4Z/7CUH/AKGK+6TXy/EX8aHp+p6+WfA/USiiivnj0wooooAKKKKACiiigAooooAKKKKACiiigAooooAK8++KHwZ0T4kQG5ONP1lFxHexrnfjosg/iHv1H6V6DRWlGtOlJTpuzInCM1yyWh8I+NPAPiDwDqJs9bsWiDEiK4T5oZh6q39DyPSudzX6C6tpGn67YS6fqlnBe2kow8MyBlP/ANf3rwXx3+y0khkvfBl6Iyct/Z942V+iSdR9G/Ovq8FntOdo19H36f8AAPHr5dKOtPVHzpU1le3WnXKXVlcTW1xGcpLC5R1PsRzWh4i8J694Suja65pV1YSdjKnyv/usOG/A1k17sZRmrrVM85pxeuh674S/aX8X6EEg1dYNdtl4zP8Au5gP99ev4g1634d/aX8D6wETUHu9GmbqLmPfGD/vpn9QK+R6MV5tfJsNV1tZ+X9WOunjqsNL39T790jxRoWvoH0nWNPvgf8AnhOrn8gcitPFfnijNEweNmRh0ZTgiug0z4ieMdHULYeJtWhReifaWZR+BJFeXU4cf/Luf3o645ovtRPu7NFfGtl+0F8RrIAf28twB/z3to2/XaDWlH+038QEGGfSpPdrT/Bq5ZZBiVs0/n/wDZZlS8z64zRzXyU37T3j1hgDSF9xan/4qqlx+0j8RJwQmo2UGe8dmn9c0lkGKfb7x/2lR8z7AqK5ureziMtzPFBGOryuFA/E18T3/wAZPiBqWRP4q1FQeohYRD/xwCuWv9V1DVJDJqF9dXjnq08rSH9TXRT4dqP45pemv+RlLNI/ZifZmv8Axu8A+Hgwn1+3u5V/5ZWWZ2P4rwPxNbHgLxvZfEHQv7a0+3nt7czvCqz43nbjnAJx1r4RxX1z+zH/AMkvi/6/p/5iozLKqWFoc8W27lYXGTrVOV7HzX8S/wDkoniX/sJXH/oZrms10vxM/wCSieJf+wlcf+hmuar6nD/wo+i/I8er8b9TqPhef+Lj+Gf+wlB/6GK+6TXwr8L/APko/hn/ALCUH/oYr7pPWvl+Iv4sPT9T18s+B+oUUUV88emFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAQX1hZ6nbPa31rBdW78NFPGHU/geK8v8T/ALNngnXi0unx3GiXDc5tGzHn3Rsj8iK9XorajiatF3pyaM50oTVpK58q+If2XPFunFn0e9sNWjHRdxhkx9G+X/x6vOta+Hvi7w6W/tTw7qVuq9ZPJLp/30uR+tfd9FevRz+vHSaUvw/r7jinltN/C7H54HgkHgjqDRX3zqnhHw9rYYanoem3m7qZrZGP54zXJaj8Afh1qIP/ABT62rH+K2nkjx+GcfpXoU+IqT+ODX4/5HNLLJr4ZHxnSV9V3n7LHgybJtr/AFm29vNRx+q1lTfsmaUxPkeKb5B6PbI38iK6o55hHu2vkYvL6y6HzTilr6Lb9kmHPy+LpPxsR/8AF0L+yTDn5vF0mPaxH/xdX/bWD/n/AAf+QvqFfsfOlFfScX7JemAjzvFV6w7hLVF/mTWpafsreD4cG51PWrj1xJGgP5LUSzzCLZt/Iay+s+h8r19c/sx/8kvi/wCv6f8AmKu6f+zv8OrHBbR5rsjvcXUjfoCBXdaFoGleGdPXTtGsYbG0Vi4iiGBk9T9a8jNM1pYml7OmnvfU7sHg50p80mfE/wAQ7ee8+JPiWK2hlnkOp3ACRIWJ+c9hVvRPg34918qbXw1exRt/y0ugIF/8fwfyFfa8Fla2ru8FtBC8jFnaOMKWJ6kkdTU1H+sE4wUKcFouv9IP7Ni5OUmfO3w9/Zr17RPEOl65rGrWEH2G4S5+z24aVnKnO0scAfXmvomiivIxWMq4mSlVZ2UaEKStAKKKK5jYKKKKACiiigAooooAKKKKACiig0AFFFFABRRRQAVma94m0Xwvbx3Gt6na6dDK/lo9w4UM2M4HvgVp14b+1l/yKWif9hA/+i2rpwdBV60aTejMq9R04Oa6Ho8fxY8ByuqJ4t0csxwM3Kj+ddPb3MF5AlxbTRzwyDKSRMGVh7EcGvmPwT8AdF8W/DODxLLq97Z380M0nOwwIUZgMjGcYXnmpv2U/EN/H4h1Lw95rvp8lqboRk5WORWUZHpkNz64FehXy6j7Oc6M23DdNHNTxU+aKqL4tj3bU/iR4O0a/m0/UfEmm2t3CdskMswDIcZwR9DU2kePfCmvXItdL8RaXd3DdIo7hS7fQZya+XfH2iQeI/2gbzRrh5I4b7U4YJHjxuUMqAkZ4zVz4z/BrT/hfp+narpOrXc/n3BhMdwVDqwUsGUqB0x+orWOV4d8kHNqU1daaEPF1PekoqyZ9aVS1fW9M8P2bXmraha2Fsv/AC0uJAg+gz1Ncd8LfGM+ofCSx8R65K8kltbStcTN96RYiw3H1JC/nXz3p9p4l/aL8fTG4vDbW0SmU7stHZQZwFVe7H9TkmuPD5fzzn7WVow3f+RvVxPKo8iu5bH0ZbfGn4e3dyLaLxVYiQnAMm5FP/AmAH612cM0VzEk0EiSxONyujBlYeoI614Zqf7J+htprLpmu6jHfqvyvchGidvcAAgfQ/nXI/A7xprXgPx4fAmttItnPcNaG3c5FtcdmT/ZY8ehyDWssDQq05Tws23HVp9iFiKkJKNaNr9UfQ2t+PfC3hu9FjrGvWFhdFBJ5M8oVtpzg49ODWf/AMLc8A/9DdpH/f8AFYXxC+BOj/EXxANavtV1C1m8hIPLgCbcKSc8gnPNfOXg/wAA2XiX4ov4Qmu7iG1W4uYROgXzMRhsHkY52jNXhMFha1Nzc3eKu9Ca2IrU5qKirPY+wtB8WaD4pEx0PVrTURAQJfs8gbZnOM/XB/Ks68+KHgnTruazu/FGlwXEDmOSJ5wGRgcEEeuaofDL4V6d8MIr+PT7+7vBfNGzm4CgrtzjG0D+9XzLd6DY+JvjbqWj6letZWd1q10slwGVTGAXOctx1AHNZ4XBUK9SolJ8sVe/UqrXqU4xuldn1TY/E7wXqd5DZWXifS7i5ncRxRRzAs7HoAPWunJCgkkADkk9q8R8KfAfwVo/iTTdS07xfNeXdnOs8cAmhbzCvOMKM447V0X7Rep32mfC+9axeSLz5ooJnQ4KxMfm57A4A/GsKmGpSrQpUJPXurGkas1BzqLbsbV98ZPh/p141nc+KbATKdrBCzqp92UEfrXS2OuaXqmnHUrHULW6sgpYzwyB0AAyckegr5b+DXwz8CePtHnj1jXLiDXTKyR2kUyRlUwMMqsDvzz06V7r8NvhRa/D7wxqWii8N3LqEshluQm0lCu1RjnkL+pNa43C4aheEZPmXdfkTQrVanvNKzL3/C3PAJ/5m7R/+/4o/wCFueAf+hu0j/v+K8K+K3wF0X4e+Dpdcs9W1G6nSeOIJMEC4Y4PQZpnwj+BGj/EXwj/AG3farqFrKbiSDy4Am3C4weQTnmun6jgvY+39o+W9tupj9Yr8/s+VXPqOCeK6gjngdZIpVDo6nIZSMgj8KwdX+IXhLQNQfTtV8Q6dZXaAFoZpgrKCMjI+laUS23hzQUSWU/ZdOtQGlfrsjTkn8BXxJrjar4+1HxN4uWJpIIZRc3BPWKN32Rr+AwPoK5suwEcTKXM7RXXzextisS6SVlds+6VZXRXRgysMgjoRWXr/inQ/C0UU2uapa6dHMxWNrhwocgZIFcl8B/F3/CW/DqwaWXfeaf/AKFPk8koBtJ+qlf1rhv2tf8AkB+HfT7VL/6AKyoYPmxX1abtq0XUr2o+1ie36RrOna/YJqGlXsF9aSEhZoHDKSDg8/Wq2v8AirQ/CscMuuara6ck7FY2uH2hyOSBXy38BvibL4E19dH1WRo9E1MqWMnAt5CPllH+yeAfbB7V337WZB0Xw4VIINzMfr8i10yyvkxcaEn7stmZLGXouolquh7Nc+KtDtNDj1641W0i0qQKyXbOBGwbhSD71j/8Lc8A/wDQ26R/3/Fc74f8FWvj74G+H9BvLme1hms7eQyQgFgVOR14rwf41fC/TvhheaXBp99d3YvYpJHNwF+XaQBjaB60YPA4etUdGUmpXf3IVfEVYRU0layPqGx+JvgvU7yCysvE2l3FzO4jiijmBZ2PQAetdNXiHw9/Z70Sy/4R3xWms6k1yiW9/wCSQmwsVDbemcZNe31w4unRhK1GTa63OijKpJXqKwUUUVymwUUUUAFFFFABRRRQAV4Z+1l/yKWif9hA/wDopq9zry34/wDgPXfH3h7TLPQbaO4nt7wzSB5VjwuxhnJPqRXbls4wxMJSdkmYYqLlSkkeOeC/g94+8a+D7O4sPEcNvol0HC2st3KFUByDmMAr1BNe5fCP4PWXwvtriZrs3+qXahZrjZtREHOxB6Z5JPXA6Vp/CTw3qPhL4faXo2rRJFe2wk8xEcOBmRmHI4PBFdhW+OzGrVlOkmuW7266meHw0IJTa1sfHnxGsdQ1T49ahY6VcfZdQuNRijt5txXy5CibWyORz3FZGj6fd+MPH9t4d8e+IdTtZFma1aW4cytHIDjy8scLuIxu5HSvXNV+Eni+6+OK+LIbGA6SNThufONwm7y1C5O3Oex4rQ+OnwRvvGGpW/iDwtBCdSfEd5E0gjEgA+WQE8bhjB9Rj0r2YZhSXs6XMleNr6aM4ZYab5p267d0d94p8Kw2Hwr1Xw3okBjii0uWC3jXljhD+ZJ/MmvFf2UtfsbLW9Z0e4dIrm/jjktyxwZNm7cg98NnHsa9w+Gv/CVReGILPxhaJDqVr+585Zlk+0IBw5weG7H1xnvXk3xM/ZxvrjV5de8DzxxSSyec9i8nlGN85LRP0HPODjHY9q8zCVafLVwtaXxfa6XOutCV41qa26H0E7Kis7sFVRksTgAe9fId5dx+N/2iIrnRj5kMurwmOWPkMkW3c/0whP0rSuPAnx21+2/sbUJNVezI2sLjUE8th/tENlh9c16z8HPglb/DgPqeozx32tzJ5e+MHy7dD1VM8knu3Hp9daUaOBhObqKUmrJL9SJueIlFcrSTvqep96+TfhWP+Mipf+v7UP5SV9ZDrXgHgP4R+LtB+Mb+Jr6wgj0s3V3KJVuEZtsgfadoOf4hXLl1WEKVZSdrx0NcTCUpwaWzPfx1r4sv/C7eM/jVqnh9LoWpvdWuk84pvCYZ26ZGenrX2mK+W/EfwS+JMvjnVtd0W1SDzr6a4triK+SNwrMcEc5HBrXJq0acql5KLa0b7kY6Dko2V9TuPh5+znJ4G8X2HiFvEMd4LPfiEWhQtuRl67jj73pXr2tWOmalpdxY6xHBLYXC+VKk5ARgxwBk984x3zjFfO2kfDz44watYy3ep6g1tHcRtMDq4IKBgW43c8Z4r1j40eBNb+IPhVNL0TUILV45xPJDNkLcYHC7h93B56HnFRi0514OpWTv1XT7iqL5acuWDXk+p5P8Rf2av7AsL7xB4X1WQw2aNcmzufvoqjJ2SDqQBxkfjXS/sz/EPWPE1rqWg6zdyXr2CJNbzyndJ5ZJBVj3wQME881wtx4B+Ot1YN4enfUpdOdfLZH1CMxsvoW3Z2+1ewfBP4TP8M9MuptQnin1a/2+cYslIkXOEBPXkkk/4V2YyrH6q4VqinK/u23MKEH7ZShFxXUrftL/APJLbj/r8t//AEKof2Yf+SYD/r/n/wDZa3fjb4T1bxp4Em0jRYEuLx7mKQI8gQbVOTyeKZ8DvCGr+CPA40nW4I4Lv7XLLsSQONrYxyOOxrgVWH9n+zv73Ne3yOjkl9Z5raWMb9pPxZ/YHgBtLhk23WsyfZwAeREPmkP5YX/gVeKfD34k+F/CngfW/DuqaNfXdxrO9LieFkACbNqAZOeMk/U16P8AGb4X+OviP44hmtLOBdFtUjt4ZXuUBCk5kfbnOcnp/sivWrT4deELO1htk8NaQ6xIqBns42ZsDGSccn3rqp4jD4fCxpy95t3dnt2MpUqtSs5LRLTU+d/2YPFw0fxjPoE0gFtq8X7vP/PZASv5ruH5V2H7Ww/4kfh3/r6l/wDQBVHx/wDBHxPbfEZPEngXTbRbVHhukRZkhWKZeqhTjg7QeP7xrrvj34B8SfEPRNDh0Wxje5t5XluI3nVPL3IBjJODzxxW069CWNpYmMkk9/J26kRp1FQnSa22OF174Wf8Jd8EvDXiDSoc6tpunjzEUc3MAJJX3ZeSPxHpXmviH4hXPijwLomgaiXlu9HncR3DHPmQFAFB91xj6Yr66+G2iX3hvwJoukalGsd5aWwjlRWDANk9xwa8S+Kn7O2s3niibUvB1pBJY3mZZIGmWPyJSfmC5/hPUY6cj0q8Dj6TqunWeibcX+hOIw0+RSprdJNHsnwj/wCSY+Gf+wfF/KvGf2tv+Qr4d/69p/8A0Ja9z+Huj3nh/wAD6JpWoIsd3aWkcUyKwYKwHIyODXm37QXwx8T/ABA1DRptAs4biO1hlSUvOseCzKR9489DXn4CrCGO55Oyu9fvOnEQk8Pypa6HqHgj/kS9A/7B1v8A+i1rarM8MWM+meGtJsLpQk9tZwwyKDkBlQAjPfkVp15dR3k2jrjsgoooqCgpaSigAooooAKKBRQAUUdqKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAoo70UAFFFFABRRR2oAKKDRQAUUUUAFFFFAH/2Q==";

const ECOLE_INIT = {
  nom: "Complexe Scolaire Protestant",
  sigle: "CSP « Sagesse Divine »",
  quartier: "Kèra, à côté du Temple EPMB Cité de Paix",
  commune: "Tchaourou",
  departement: "Borgou",
  directeur: "Past. A. S. Boko",
  telephone: "97 00 00 00",
  telephoneDirecteur: "97 11 22 33",
  email: "contact@csp-sagessedivine.bj",
  devise: "Excellence Réelle",
  logoUrl: LOGO_CSP_BASE64,
};

const CLASSES_INIT = ["Maternelle 1", "Maternelle 2", "CI", "CP", "CE1", "CE2", "CM1", "CM2"];

/* Codes d'accès du personnel — modifiables par le Directeur dans Paramètres.
   Le code d'un parent, lui, est le code élève (CSPxxxx) généré à la validation :
   il n'est jamais montré au parent automatiquement, le Directeur le communique lui-même. */
const CODES_INIT = { directeur: "1234", enseignant: "5678", secretaire: "9012" };

const ANNEE_INIT = "2026-2027";

/* Catalogue des frais de l'année en cours — modifiable par le Directeur.
   Sert de modèle appliqué automatiquement à chaque nouvel élève inscrit. */
const FRAIS_TYPES_INIT = [
  { libelle: "Inscription", montant: 25000 },
  { libelle: "Écolage", montant: 90000 },
  { libelle: "Cantine", montant: 20000 },
  { libelle: "T-shirt", montant: 5000 },
  { libelle: "Uniforme", montant: 15000 },
];

/* Contexte global : identité de l'école, classes, frais, année scolaire,
   matières par classe et codes d'accès — partagés depuis n'importe quel écran. */
const EcoleContext = createContext(null);
function useEcole() {
  return useContext(EcoleContext);
}

const MATIERES_INIT = [
  { nom: "Communication orale", coef: 1 },
  { nom: "Expression écrite", coef: 2 },
  { nom: "Lecture", coef: 2 },
  { nom: "Dictée", coef: 1 },
  { nom: "EST", coef: 1 },
];

/* Matières définies par classe — chaque classe a son propre programme.
   Dès qu'un élève est inscrit dans une classe, ce sont ces matières qui
   apparaissent automatiquement sur sa page de notes. */
const MATIERES_PAR_CLASSE_INIT = {
  CM1: MATIERES_INIT,
};


const SEUILS_MENTION = [
  { max: 5, mention: "Médiocre" },
  { max: 9, mention: "Insuffisant" },
  { max: 11, mention: "Passable" },
  { max: 13, mention: "Assez Bien" },
  { max: 15, mention: "Bien" },
  { max: 18, mention: "Très Bien" },
  { max: 20, mention: "Excellent" },
];

function mentionPour(moyenne) {
  const seuil = SEUILS_MENTION.find((s) => moyenne <= s.max);
  return seuil ? seuil.mention : "Excellent";
}

function ageDepuis(dateNaissance) {
  if (!dateNaissance) return null;
  const naissance = new Date(dateNaissance);
  if (isNaN(naissance)) return null;
  const aujourdhui = new Date();
  let age = aujourdhui.getFullYear() - naissance.getFullYear();
  const pasEncoreAnniversaire =
    aujourdhui.getMonth() < naissance.getMonth() ||
    (aujourdhui.getMonth() === naissance.getMonth() && aujourdhui.getDate() < naissance.getDate());
  if (pasEncoreAnniversaire) age -= 1;
  return age >= 0 ? age : null;
}

/* Code élève : toujours préfixé CSP, suivi de 4 caractères mélangeant
   chiffres et lettres (majuscules) — plus difficile à deviner qu'une
   simple suite de 4 chiffres. Ex. CSP7K2B. */
/* Formate la date du jour en français, ex. "26 août 2026" — utilisé pour
   horodater automatiquement la saisie d'une note. */
function formatDateFr() {
  const mois = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
  const d = new Date();
  return `${d.getDate()} ${mois[d.getMonth()]} ${d.getFullYear()}`;
}

function genererCodeEleve() {
  const caracteres = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sans 0/O/1/I pour éviter les confusions
  let suffixe = "";
  for (let i = 0; i < 4; i++) {
    suffixe += caracteres[Math.floor(Math.random() * caracteres.length)];
  }
  return `CSP${suffixe}`;
}

const ELEVES_INIT = [
  {
    id: "CSP0142",
    nom: "Adjovi",
    prenom: "Grâce",
    classe: "CM1",
    naissance: "12/04/2015",
    notes: [
      { evaluation: "Évaluation 1", mois: "Septembre", matiere: "Expression écrite", note20: 16, dateSaisie: "13 août 2026" },
      { evaluation: "Évaluation 1", mois: "Septembre", matiere: "Lecture", note20: 14, dateSaisie: "13 août 2026" },
      { evaluation: "Devoir 1", mois: "Octobre", matiere: "Dictée", note20: 12, dateSaisie: "14 août 2026" },
    ],
    absences: [
      { date: "11 août 2026", type: "Permissionnaire", motif: "Cérémonie familiale" },
      { date: "02 sept. 2026", type: "Malade", motif: "Paludisme" },
    ],
    frais: [
      { libelle: "Inscription", du: 25000, paye: 25000 },
      { libelle: "Écolage", du: 90000, paye: 60000 },
      { libelle: "Cantine", du: 20000, paye: 10000 },
      { libelle: "Uniforme", du: 15000, paye: 15000 },
    ],
    messages: [
      { auteur: "École", texte: "Réunion de parents le 5 septembre à 9h.", date: "30 août 2026" },
    ],
    parent: { nom: "M. et Mme Adjovi", telephone: "97 00 00 00" },
    enseignant: "Mme Houssou",
  },
  {
    id: "CSP0198",
    nom: "Toko",
    prenom: "Emmanuel",
    classe: "CM1",
    naissance: "03/11/2014",
    notes: [
      { evaluation: "Évaluation 1", mois: "Septembre", matiere: "Expression écrite", note20: 10, dateSaisie: "13 août 2026" },
      { evaluation: "Évaluation 1", mois: "Septembre", matiere: "Lecture", note20: 9, dateSaisie: "13 août 2026" },
    ],
    absences: [],
    frais: [
      { libelle: "Inscription", du: 25000, paye: 25000 },
      { libelle: "Écolage", du: 90000, paye: 30000 },
    ],
    messages: [],
    parent: { nom: "M. Toko", telephone: "96 00 00 00" },
    enseignant: "Mme Houssou",
  },
];

const PERSONNEL_INIT = [
  { nom: "Past. A. S. Boko", poste: "Directeur", telephone: "97 11 22 33", classe: "—" },
  { nom: "Mme Houssou", poste: "Enseignante", telephone: "96 22 33 44", classe: "CM1" },
  { nom: "Mlle Dossou", poste: "Secrétaire", telephone: "95 33 44 55", classe: "—" },
];

const DEMANDES_INIT = [
  {
    id: "DEM-0007",
    prenom: "Nadège",
    nom: "Kora",
    sexe: "F",
    naissance: "2016-02-18",
    classeSouhaitee: "CE1",
    parrainNom: "Mme Kora",
    parrainTelephone: "94 55 66 77",
    message: "Nous déménageons à Tchaourou ce mois-ci.",
    origine: "en_ligne",
    date: "23 août 2026",
    statut: "en_attente",
  },
];

const ANNONCES_INIT = [
  { titre: "Congés de Noël", texte: "Les congés de Noël débutent le 20 décembre.", date: "24 août 2026" },
  { titre: "Réunion des parents", texte: "Réunion générale le 5 septembre à 9h.", date: "22 août 2026" },
];

/* ------------------------------------------------------------------
   PALETTE — voir plan de design
   Ardoise #1B2A4A · Or #C9A227 · Papier #FAF6EE · Encre #2B2118 · Vert #2F5233
------------------------------------------------------------------- */

const ROLES = [
  { id: "fondateur", label: "Espace Fondateur", s
  { id: "directeur", label: "Espace Administratif
  { id: "enseignant", label: "Enseignant", icon:
  { id: "secretaire", label: "Secrétaire", icon:
  { id: "parent", label: "Espace Parent", icon: C
];

function Embleme({ logoUrl, taille = 56, iconTaille = 26 }) {
  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt="Logo de l'école"
        className="rounded-full object-cover"
        style={{ width: taille, height: taille, background: "#1B2A4A" }}
        onError={(e) => { e.target.style.display = "none"; }}
      />
    );
  }
  return (
    <div className="flex items-center justify-center rounded-full" style={{ width: taille, height: taille, background: "#1B2A4A" }}>
      <School size={iconTaille} color="#C9A227" />
    </div>
  );
}

function Cachet() {
  return (
    <div className="pointer-events-none absolute -right-3 -top-3 rotate-12 opacity-90">
      <div className="flex h-16 w-16 items-center justify-center rounded-full border-[3px] border-dashed"
           style={{ borderColor: "#C9A227", color: "#C9A227" }}>
        <Stamp size={22} />
      </div>
    </div>
  );
}

function Badge({ children, tone = "or" }) {
  const tones = {
    or: { bg: "#FBF0D2", fg: "#8A6D14", ring: "#C9A227" },
    vert: { bg: "#E4EEE3", fg: "#2F5233", ring: "#2F5233" },
    ardoise: { bg: "#E6EAF2", fg: "#1B2A4A", ring: "#1B2A4A" },
  };
  const t = tones[tone];
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[13px] font-semibold"
      style={{ background: t.bg, color: t.fg, boxShadow: `inset 0 0 0 1px ${t.ring}33` }}
    >
      {children}
    </span>
  );
}

function Panel({ title, icon: Icon, actions, children }) {
  return (
    <div className="rounded-2xl border bg-white/80 shadow-sm" style={{ borderColor: "#E7DEC8" }}>
      <div className="flex items-center justify-between border-b px-5 py-3.5" style={{ borderColor: "#EFE7D4" }}>
        <div className="flex items-center gap-2">
          {Icon && <Icon size={17} style={{ color: "#1B2A4A" }} />}
          <h3 className="font-serif text-[15px] tracking-wide" style={{ color: "#1B2A4A" }}>{title}</h3>
        </div>
        {actions}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function Stat({ label, value, tone }) {
  const tones = { ardoise: "#1B2A4A", or: "#8A6D14", vert: "#2F5233" };
  return (
    <div className="rounded-xl bg-white/80 px-4 py-3 shadow-sm ring-1" style={{ ringColor: "#EFE7D4" }}>
      <div className="text-[12px] uppercase tracking-wider" style={{ color: "#9A8B67" }}>{label}</div>
      <div className="font-serif text-2xl" style={{ color: tones[tone] || "#1B2A4A" }}>{value}</div>
    </div>
  );
}

function Btn({ children, onClick, variant = "primary", icon: Icon, small }) {
  const base = "inline-flex items-center gap-1.5 rounded-lg font-medium transition";
  const size = small ? "px-2.5 py-1 text-[13px]" : "px-3.5 py-2 text-[15px]";
  const styles = {
    primary: { background: "#1B2A4A", color: "#FAF6EE" },
    gold: { background: "#C9A227", color: "#2B2118" },
    ghost: { background: "transparent", color: "#1B2A4A", boxShadow: "inset 0 0 0 1px #1B2A4A55" },
    danger: { background: "transparent", color: "#8A2E2E", boxShadow: "inset 0 0 0 1px #8A2E2E55" },
  };
  return (
    <button onClick={onClick} className={`${base} ${size} hover:opacity-90 active:scale-[0.98]`} style={styles[variant]}>
      {Icon && <Icon size={small ? 13 : 15} />}
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------
   ÉCRAN DE CONNEXION
------------------------------------------------------------------- */

function Connexion({ onEntrer, onInscription, eleves }) {
  const [choix, setChoix] = useState(null);
  const [code, setCode] = useState("");
  const [erreur, setErreur] = useState("");
  const { ecole, codes } = useEcole();
  const zoneCodeRef = useRef(null);

  useEffect(() => {
    if (choix && zoneCodeRef.current) {
      zoneCodeRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [choix]);

  const valider = () => {
    const saisie = code.trim();
    if (!saisie) { setErreur("Merci de saisir ton code d'accès."); return; }

    if (choix === "parent") {
      const enfant = eleves.find((e) => e.id.toLowerCase() === saisie.toLowerCase());
      if (!enfant) { setErreur("Ce code élève est introuvable. Vérifie-le auprès du secrétariat."); return; }
      setErreur("");
      onEntrer("parent", enfant.id);
      return;
    }

    if (saisie !== codes[choix]) { setErreur("Code incorrect."); return; }
    setErreur("");
    onEntrer(choix);
  };

  return (
    <div className="min-h-screen w-full" style={{ background: "#FAF6EE" }}>
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col items-center px-6 py-12 sm:justify-center sm:py-16">
        <div className="mb-8 mt-4 text-center sm:mb-10 sm:mt-0">
          <div className="mx-auto mb-4">
            <Embleme logoUrl={ecole.logoUrl} taille={56} iconTaille={26} />
          </div>
          <p className="text-[13px] uppercase tracking-[0.2em]" style={{ color: "#9A8B67" }}>École Connectée</p>
          <h1 className="mt-1 font-serif text-3xl" style={{ color: "#1B2A4A" }}>{ecole.nom}</h1>
          <p className="font-serif text-lg italic" style={{ color: "#8A6D14" }}>{ecole.sigle}</p>
          <p className="mt-1 text-[15px]" style={{ color: "#5C5240" }}>{ecole.quartier} — {ecole.commune}, {ecole.departement}</p>
          <p className="mt-1.5 text-[15px]" style={{ color: "#8A6D14" }}>
            {ecole.telephoneDirecteur && <>Directeur : {ecole.telephoneDirecteur}</>}
            {ecole.telephoneDirecteur && ecole.email && " · "}
            {ecole.email}
          </p>
        </div>

        <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2">
          {ROLES.map((r) => {
            const Icon = r.icon;
            const actif = choix === r.id;
            return (
              <button
                key={r.id}
                onClick={() => { setChoix(r.id); setCode(""); setErreur(""); }}
                className="group relative overflow-hidden rounded-2xl border p-5 text-left transition"
                style={{
                  borderColor: actif ? "#C9A227" : "#E7DEC8",
                  background: actif ? "#FFFDF6" : "#FFFFFFAA",
                  boxShadow: actif ? "0 0 0 2px #C9A22755" : "none",
                }}
              >
                {actif && <Cachet />}
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg"
                     style={{ background: "#1B2A4A" }}>
                  <Icon size={18} color="#C9A227" />
                </div>
                <div className="font-serif text-lg" style={{ color: "#1B2A4A" }}>{r.label}</div>
                <div className="mt-0.5 text-[15px]" style={{ color: "#5C5240" }}>{r.desc}</div>
              </button>
            );
          })}
        </div>

        {choix && (
          <div ref={zoneCodeRef} className="mt-6 w-full max-w-md scroll-mt-8">
            <div className="flex items-center gap-2 rounded-xl border bg-white/80 px-4 py-3"
                 style={{ borderColor: erreur ? "#8A2E2E" : "#E7DEC8" }}>
              <KeyRound size={16} style={{ color: "#9A8B67" }} />
              <input
                autoFocus
                value={code}
                onChange={(e) => setCode(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") valider(); }}
                placeholder={choix === "parent" ? "Code élève reçu de l'école (ex. CSP0142)" : "Code d'accès"}
                className="w-full bg-transparent text-[15px] outline-none"
                style={{ color: "#2B2118" }}
              />
              <Btn variant="gold" onClick={valider}>Entrer<ChevronRight size={14} /></Btn>
            </div>
            {erreur && <p className="mt-1.5 px-1 text-[13px]" style={{ color: "#8A2E2E" }}>{erreur}</p>}
            {choix === "parent" && !erreur && (
              <p className="mt-1.5 px-1 text-[13px]" style={{ color: "#9A8B67" }}>Ce code t'est communiqué par le secrétariat après validation de l'inscription de ton enfant. Pour tester la démo : {eleves[0]?.id} (Grâce) ou {eleves[1]?.id} (Emmanuel).</p>
            )}
            {choix !== "parent" && !erreur && (
              <p className="mt-1.5 px-1 text-[13px]" style={{ color: "#9A8B67" }}>Code de démonstration pour ce rôle : <span className="font-mono font-semibold">{codes[choix]}</span> (modifiable ensuite dans Paramètres).</p>
            )}
          </div>
        )}

        <div className="mt-8 flex flex-col items-center gap-3">
          <button
            onClick={onInscription}
            className="flex items-center gap-2 rounded-full border px-4 py-2 text-[15px] font-medium transition hover:opacity-80"
            style={{ borderColor: "#C9A227", color: "#8A6D14", background: "#FFFDF6" }}
          >
            <FileText size={14} />
            Inscrire mon enfant en ligne
          </button>
          <p className="text-[13px]" style={{ color: "#9A8B67" }}>
            Prototype de démonstration — aucune donnée réelle n'est enregistrée.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------
   INSCRIPTION EN LIGNE (accès public, sans connexion)
------------------------------------------------------------------- */

function InscriptionEnLigne({ onRetour, onSoumettre }) {
  const { ecole, classes } = useEcole();
  const [envoye, setEnvoye] = useState(false);
  const [form, setForm] = useState({
    prenom: "", nom: "", sexe: "", naissance: "", classeSouhaitee: classes[0],
    parrainNom: "", parrainTelephone: "", message: "",
  });

  const champ = (cle) => (e) => setForm({ ...form, [cle]: e.target.value });
  const age = useMemo(() => ageDepuis(form.naissance), [form.naissance]);

  const valide = form.prenom.trim() && form.nom.trim() && form.sexe && form.naissance
    && form.parrainNom.trim() && form.parrainTelephone.trim();

  const soumettre = () => {
    if (!valide) return;
    onSoumettre({
      id: `DEM-${Math.floor(1000 + Math.random() * 9000)}`,
      ...form,
      age,
      origine: "en_ligne",
      date: "aujourd'hui",
      statut: "en_attente",
    });
    setEnvoye(true);
  };

  if (envoye) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6" style={{ background: "#FAF6EE" }}>
        <div className="max-w-md rounded-2xl border bg-white/80 p-8 text-center shadow-sm" style={{ borderColor: "#E7DEC8" }}>
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full" style={{ background: "#E4EEE3" }}>
            <CheckCircle2 size={26} style={{ color: "#2F5233" }} />
          </div>
          <h2 className="font-serif text-xl" style={{ color: "#1B2A4A" }}>Demande envoyée</h2>
          <p className="mt-2 text-[15px]" style={{ color: "#5C5240" }}>
            La demande d'inscription de <strong>{form.prenom} {form.nom}</strong> a bien été transmise au secrétariat de {ecole.sigle}. Vous serez contacté(e) au {form.parrainTelephone} dès sa validation.
          </p>
          <div className="mt-6">
            <Btn variant="primary" icon={ArrowLeft} onClick={onRetour}>Retour à l'accueil</Btn>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full" style={{ background: "#FAF6EE" }}>
      <div className="mx-auto max-w-2xl px-6 py-12">
        <button onClick={onRetour} className="mb-6 flex items-center gap-1.5 text-[15px]" style={{ color: "#8A6D14" }}>
          <ArrowLeft size={14} /> Retour
        </button>

        <div className="mb-6 text-center">
          <p className="text-[13px] uppercase tracking-[0.2em]" style={{ color: "#9A8B67" }}>Inscription en ligne</p>
          <h1 className="mt-1 font-serif text-2xl" style={{ color: "#1B2A4A" }}>{ecole.sigle}</h1>
          <p className="mt-1 text-[15px]" style={{ color: "#5C5240" }}>
            Remplissez ce formulaire depuis chez vous — le secrétariat examinera votre demande et vous contactera pour la confirmer.
          </p>
        </div>

        <Panel title="Informations de l'enfant" icon={FileText}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Champ label="Prénom de l'enfant" value={form.prenom} onChange={champ("prenom")} />
            <Champ label="Nom de l'enfant" value={form.nom} onChange={champ("nom")} />
            <div>
              <label className="mb-1 block text-[13px] font-medium" style={{ color: "#5C5240" }}>Sexe</label>
              <div className="flex gap-2">
                {[{ v: "F", l: "Féminin" }, { v: "M", l: "Masculin" }].map((opt) => (
                  <button
                    key={opt.v}
                    type="button"
                    onClick={() => setForm({ ...form, sexe: opt.v })}
                    className="flex-1 rounded-lg border px-3 py-2 text-[15px] transition"
                    style={{
                      borderColor: form.sexe === opt.v ? "#C9A227" : "#E7DEC8",
                      background: form.sexe === opt.v ? "#FBF0D2" : "transparent",
                      color: form.sexe === opt.v ? "#8A6D14" : "#5C5240",
                      fontWeight: form.sexe === opt.v ? 600 : 400,
                    }}
                  >
                    {opt.l}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="mb-1 block text-[13px] font-medium" style={{ color: "#5C5240" }}>Date de naissance</label>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={form.naissance}
                  onChange={champ("naissance")}
                  className="w-full rounded-lg border px-3 py-2 text-[15px] outline-none"
                  style={{ borderColor: "#E7DEC8" }}
                />
                {age !== null && <Badge tone="ardoise">{age} an{age > 1 ? "s" : ""}</Badge>}
              </div>
            </div>
            <div>
              <label className="mb-1 block text-[13px] font-medium" style={{ color: "#5C5240" }}>Classe souhaitée</label>
              <select
                value={form.classeSouhaitee}
                onChange={champ("classeSouhaitee")}
                className="w-full rounded-lg border px-3 py-2 text-[15px] outline-none"
                style={{ borderColor: "#E7DEC8" }}
              >
                {classes.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
        </Panel>

        <div className="h-4" />

        <Panel title="Coordonnées du parrain" icon={UserCircle2}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Champ label="Nom du parrain" value={form.parrainNom} onChange={champ("parrainNom")} />
            <Champ label="Numéro du parrain" value={form.parrainTelephone} onChange={champ("parrainTelephone")} placeholder="9x xx xx xx" />
          </div>
          <div className="mt-3">
            <label className="mb-1 block text-[13px] font-medium" style={{ color: "#5C5240" }}>Message (optionnel)</label>
            <textarea
              value={form.message}
              onChange={champ("message")}
              rows={3}
              className="w-full rounded-lg border px-3 py-2 text-[15px] outline-none"
              style={{ borderColor: "#E7DEC8" }}
              placeholder="Une précision à transmettre au secrétariat ?"
            />
          </div>
        </Panel>

        <div className="mt-5 flex items-center justify-between">
          {!valide && <p className="text-[13px]" style={{ color: "#8A2E2E" }}>Merci de remplir les champs obligatoires.</p>}
          <div className="ml-auto">
            <Btn variant="gold" icon={Send} onClick={soumettre}>Soumettre la demande</Btn>
          </div>
        </div>
      </div>
    </div>
  );
}

function Champ({ label, value, onChange, placeholder }) {
  return (
    <div>
      <label className="mb-1 block text-[13px] font-medium" style={{ color: "#5C5240" }}>{label}</label>
      <input
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full rounded-lg border px-3 py-2 text-[15px] outline-none"
        style={{ borderColor: "#E7DEC8" }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------
   MISE EN PAGE COMMUNE
------------------------------------------------------------------- */

function Coquille({ role, roleLabel, onQuitter, children, nav, actif, setActif }) {
  const { ecole } = useEcole();
  return (
    <div className="min-h-screen w-full" style={{ background: "#FAF6EE" }}>
      <header className="sticky top-0 z-10 border-b backdrop-blur"
              style={{ borderColor: "#E7DEC8", background: "#FAF6EEEE" }}>
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="shrink-0">
              <Embleme logoUrl={ecole.logoUrl} taille={32} iconTaille={15} />
            </div>
            <div className="min-w-0">
              <div className="truncate font-serif text-[15px] leading-none" style={{ color: "#1B2A4A" }}>{ecole.sigle}</div>
              <div className="text-[12px]" style={{ color: "#9A8B67" }}>{ecole.commune}</div>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <Badge tone="ardoise"><UserCircle2 size={12} /><span className="max-w-[38vw] truncate sm:max-w-none">{roleLabel}</span></Badge>
            <button onClick={onQuitter} className="flex shrink-0 items-center gap-1 text-[13px]" style={{ color: "#8A2E2E" }}>
              <LogOut size={13} /> Quitter
            </button>
          </div>
        </div>
      </header>

      {/* Navigation mobile : onglets horizontaux défilants */}
      <div className="sticky top-[57px] z-10 border-b sm:hidden" style={{ borderColor: "#E7DEC8", background: "#FAF6EEEE" }}>
        <div className="flex gap-1.5 overflow-x-auto px-4 py-2" style={{ WebkitOverflowScrolling: "touch" }}>
          {nav.map((n) => {
            const Icon = n.icon;
            const isActif = actif === n.id;
            return (
              <button
                key={n.id}
                onClick={() => setActif(n.id)}
                className="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-[13px] font-medium transition"
                style={{
                  background: isActif ? "#1B2A4A" : "transparent",
                  color: isActif ? "#FAF6EE" : "#3E3625",
                  boxShadow: isActif ? "none" : "inset 0 0 0 1px #E7DEC8",
                }}
              >
                <Icon size={13} />
                {n.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-5 sm:flex-row sm:px-6 sm:py-6">
        {/* Navigation desktop : barre latérale */}
        <nav className="hidden w-52 shrink-0 sm:block">
          <div className="sticky top-20 space-y-1">
            {nav.map((n) => {
              const Icon = n.icon;
              const isActif = actif === n.id;
              return (
                <button
                  key={n.id}
                  onClick={() => setActif(n.id)}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[15px] transition"
                  style={{
                    background: isActif ? "#1B2A4A" : "transparent",
                    color: isActif ? "#FAF6EE" : "#3E3625",
                  }}
                >
                  <Icon size={15} />
                  {n.label}
                </button>
              );
            })}
          </div>
        </nav>
        <main className="min-w-0 flex-1 space-y-5 pb-16 sm:pb-0">{children}</main>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------
   ESPACE DIRECTEUR
------------------------------------------------------------------- */

function EspaceDirecteur({ eleves, personnel, setPersonnel, annonces, setAnnonces, demandes, setDemandes, setEleves }) {
  const {
    ecole, setEcole, classes, setClasses,
    fraisTypes, setFraisTypes, anneeScolaire, setAnneeScolaire,
    codes, setCodes, matieresParClasse, setMatieresParClasse,
  } = useEcole();
  const [onglet, setOnglet] = useState("dashboard");
  const [classeVue, setClasseVue] = useState(classes[0] || "CI");
  const [nouvelleAnnonce, setNouvelleAnnonce] = useState("");
  const [annonceEnEdition, setAnnonceEnEdition] = useState(null);
  const [confirmationValidation, setConfirmationValidation] = useState(null);
  const modifierAnnonce = (index, cle, valeur) => {
    setAnnonces((prev) => prev.map((a, i) => i === index ? { ...a, [cle]: valeur } : a));
  };
  const supprimerAnnonce = (index) => {
    setAnnonces((prev) => prev.filter((_, i) => i !== index));
  };

  const stats = useMemo(() => {
    const total = eleves.length;
    const dus = eleves.reduce((s, e) => s + e.frais.reduce((a, f) => a + f.du, 0), 0);
    const payes = eleves.reduce((s, e) => s + e.frais.reduce((a, f) => a + f.paye, 0), 0);
    return { total, dus, payes, reste: dus - payes };
  }, [eleves]);

  const enAttente = demandes.filter((d) => d.statut === "en_attente").length;

  const valider = (demande) => {
    const codeGenere = genererCodeEleve();
    setDemandes((prev) => prev.map((d) => d.id === demande.id ? { ...d, statut: "validee" } : d));
    setEleves((prev) => [
      ...prev,
      {
        id: codeGenere,
        nom: demande.nom,
        prenom: demande.prenom,
        classe: demande.classeSouhaitee,
        naissance: demande.naissance,
        notes: [],
        absences: [],
        frais: fraisTypes.map((f) => ({ libelle: f.libelle, du: f.montant, paye: 0 })),
        messages: [],
        parent: { nom: demande.parrainNom, telephone: demande.parrainTelephone },
        enseignant: "À affecter",
      },
    ]);
    setConfirmationValidation({ nom: `${demande.prenom} ${demande.nom}`, code: codeGenere });
  };

  const refuser = (demande) => {
    setDemandes((prev) => prev.map((d) => d.id === demande.id ? { ...d, statut: "refusee" } : d));
  };

  // --- Classes : ajout, édition en ligne, suppression ---
  const [nouvelleClasse, setNouvelleClasse] = useState("");
  const [classeEnEdition, setClasseEnEdition] = useState(null); // index en cours d'édition

  const ajouterClasse = () => {
    const nom = nouvelleClasse.trim();
    if (!nom || classes.includes(nom)) return;
    setClasses((prev) => [...prev, nom]);
    setNouvelleClasse("");
  };

  const renommerClasse = (index, nouveauNom) => {
    const nom = nouveauNom.trim();
    if (!nom) return;
    const ancienNom = classes[index];
    setClasses((prev) => prev.map((c, i) => (i === index ? nom : c)));
    setEleves((prev) => prev.map((e) => e.classe === ancienNom ? { ...e, classe: nom } : e));
    if (ancienNom !== nom) {
      setMatieresParClasse((prev) => {
        const { [ancienNom]: anciennesMatieres, ...reste } = prev;
        return anciennesMatieres ? { ...reste, [nom]: anciennesMatieres } : prev;
      });
    }
  };

  const [classeASupprimer, setClasseASupprimer] = useState(null); // index en attente de confirmation

  const supprimerClasse = (index) => {
    const nomClasse = classes[index];
    const nbEleves = eleves.filter((e) => e.classe === nomClasse).length;
    if (nbEleves > 0 && classeASupprimer !== index) {
      setClasseASupprimer(index);
      return;
    }
    setClasses((prev) => prev.filter((_, i) => i !== index));
    setClasseASupprimer(null);
  };

  // --- Matières par classe : une section par classe, chacune avec son propre ajout/édition/suppression ---
  const [nouvellesMatieresParClasse, setNouvellesMatieresParClasse] = useState({}); // { [classe]: { nom, coef } }

  const champNouvelleMatiere = (classe, cle, valeur) => {
    setNouvellesMatieresParClasse((prev) => ({
      ...prev,
      [classe]: { nom: "", coef: 1, ...prev[classe], [cle]: valeur },
    }));
  };

  const ajouterMatiereClasse = (classe) => {
    const saisie = nouvellesMatieresParClasse[classe] || { nom: "", coef: 1 };
    if (!saisie.nom.trim()) return;
    setMatieresParClasse((prev) => ({
      ...prev,
      [classe]: [...(prev[classe] || []), { nom: saisie.nom.trim(), coef: Number(saisie.coef) || 1 }],
    }));
    setNouvellesMatieresParClasse((prev) => ({ ...prev, [classe]: { nom: "", coef: 1 } }));
  };

  const modifierMatiereClasse = (classe, index, cle, valeur) => {
    setMatieresParClasse((prev) => ({
      ...prev,
      [classe]: (prev[classe] || []).map((m, i) => i === index ? { ...m, [cle]: cle === "coef" ? Number(valeur) || 1 : valeur } : m),
    }));
  };

  const supprimerMatiereClasse = (classe, index) => {
    setMatieresParClasse((prev) => ({
      ...prev,
      [classe]: (prev[classe] || []).filter((_, i) => i !== index),
    }));
  };

  // --- Frais scolaires : catalogue de l'année en cours ---
  const [nouveauFrais, setNouveauFrais] = useState({ libelle: "", montant: "" });

  const ajouterFrais = () => {
    if (!nouveauFrais.libelle.trim()) return;
    const nouveau = { libelle: nouveauFrais.libelle.trim(), montant: Number(nouveauFrais.montant) || 0 };
    setFraisTypes((prev) => [...prev, nouveau]);
    setEleves((prev) => prev.map((e) => e.frais.find((ff) => ff.libelle === nouveau.libelle) ? e : { ...e, frais: [...e.frais, { libelle: nouveau.libelle, du: nouveau.montant, paye: 0, mode: null, datePaiement: null }] }));
    setNouveauFrais({ libelle: "", montant: "" });
  };

  const modifierFrais = (index, cle, valeur) => {
    setFraisTypes((prev) => prev.map((f, i) => i === index ? { ...f, [cle]: cle === "montant" ? Number(valeur) || 0 : valeur } : f));
  };

  const supprimerFrais = (index) => {
    setFraisTypes((prev) => prev.filter((_, i) => i !== index));
  };

  // --- Personnel : ajout, édition, suppression ---
  const [personnelEnEdition, setPersonnelEnEdition] = useState(null);
  const [nouveauPersonnel, setNouveauPersonnel] = useState({ nom: "", poste: "Enseignant", classe: "—", telephone: "" });

  const ajouterPersonnel = () => {
    if (!nouveauPersonnel.nom.trim()) return;
    setPersonnel((prev) => [...prev, { ...nouveauPersonnel, nom: nouveauPersonnel.nom.trim() }]);
    setNouveauPersonnel({ nom: "", poste: "Enseignant", classe: "—", telephone: "" });
  };

  const modifierPersonnel = (index, cle, valeur) => {
    setPersonnel((prev) => prev.map((p, i) => i === index ? { ...p, [cle]: valeur } : p));
  };

  const supprimerPersonnel = (index) => {
    setPersonnel((prev) => prev.filter((_, i) => i !== index));
  };

  // --- Paramètres de l'école : identité et codes d'accès modifiables ---
  const champEcole = (cle) => (e) => setEcole({ ...ecole, [cle]: e.target.value });
  const champCode = (role) => (e) => setCodes({ ...codes, [role]: e.target.value });

  // --- Messagerie administrative : diffusion à tout le personnel ou à une personne précise ---
  const { messagesInternes, setMessagesInternes, anneesArchivees, setAnneesArchivees } = useEcole();
  const [nouveauMessageInterne, setNouveauMessageInterne] = useState({ destinataire: "tous", texte: "" });

  const envoyerMessageInterne = () => {
    if (!nouveauMessageInterne.texte.trim()) return;
    setMessagesInternes((prev) => [
      { destinataire: nouveauMessageInterne.destinataire, texte: nouveauMessageInterne.texte.trim(), date: "aujourd'hui" },
      ...prev,
    ]);
    setNouveauMessageInterne({ ...nouveauMessageInterne, texte: "" });
  };

  const [messageInterneEnEdition, setMessageInterneEnEdition] = useState(null);
  const modifierMessageInterne = (index, texte) => {
    if (!texte.trim()) return;
    setMessagesInternes((prev) => prev.map((m, i) => i === index ? { ...m, texte: texte.trim() } : m));
  };
  const supprimerMessageInterne = (index) => {
    setMessagesInternes((prev) => prev.filter((_, i) => i !== index));
  };

  // --- Suivi pédagogique : vérifier à distance si chaque enseignant saisit bien notes/absences ---
  const { messagesParents, setMessagesParents } = useEcole();
  const suiviParClasse = useMemo(() => classes.map((c) => {
    const eleveClasse = eleves.filter((e) => e.classe === c);
    const enseignant = personnel.find((p) => p.classe === c && (p.poste === "Enseignant" || p.poste === "Enseignante"));
    const totalNotes = eleveClasse.reduce((s, e) => s + e.notes.length, 0);
    const totalAbsences = eleveClasse.reduce((s, e) => s + e.absences.length, 0);
    const toutesNotes = eleveClasse.flatMap((e) => e.notes);
    const derniereSaisie = toutesNotes.length ? toutesNotes[toutesNotes.length - 1].dateSaisie : null;
    return { classe: c, enseignant, nbEleves: eleveClasse.length, totalNotes, totalAbsences, derniereSaisie };
  }), [classes, eleves, personnel]);

  // --- Messages reçus des parents ---
  const [reponseParent, setReponseParent] = useState({}); // { [index]: texte }
  const marquerLu = (index) => {
    setMessagesParents((prev) => prev.map((m, i) => i === index ? { ...m, lu: true } : m));
  };
  const repondreParent = (index, msg) => {
    const texte = (reponseParent[index] || "").trim();
    if (!texte) return;
    setEleves((prev) => prev.map((e) => e.id === msg.eleveId
      ? { ...e, messages: [...e.messages, { auteur: "Administration", texte, date: "aujourd'hui" }] }
      : e));
    setMessagesParents((prev) => prev.map((m, i) => i === index ? { ...m, lu: true } : m));
    setReponseParent((prev) => ({ ...prev, [index]: "" }));
  };

  // --- Clôture de l'année scolaire : archive les résultats, ouvre une nouvelle année vierge ---
  const [nouvelleAnneeLabel, setNouvelleAnneeLabel] = useState("");
  const [confirmationCloture, setConfirmationCloture] = useState(null);
  const [demandeConfirmationCloture, setDemandeConfirmationCloture] = useState(false);
  const [erreurCloture, setErreurCloture] = useState("");

  const demarrerCloture = () => {
    const label = nouvelleAnneeLabel.trim();
    if (!label) { setErreurCloture("Indique d'abord le nom de la nouvelle année (ex. 2027-2028)."); return; }
    setErreurCloture("");
    setDemandeConfirmationCloture(true);
  };

  const cloturerAnnee = () => {
    const label = nouvelleAnneeLabel.trim();
    if (!label) return;

    setAnneesArchivees((prev) => [{ annee: anneeScolaire, eleves, dateArchivage: "aujourd'hui" }, ...prev]);
    setEleves((prev) => prev.map((e) => ({
      ...e,
      notes: [],
      absences: [],
      frais: fraisTypes.map((f) => ({ libelle: f.libelle, du: f.montant, paye: 0 })),
      messages: [],
    })));
    setConfirmationCloture({ ancienneAnnee: anneeScolaire, nouvelleAnnee: label, nbEleves: eleves.length });
    setAnneeScolaire(label);
    setNouvelleAnneeLabel("");
    setDemandeConfirmationCloture(false);
  };

  const nav = [
    { id: "dashboard", label: "Tableau de bord", icon: LayoutDashboard },
    { id: "bibliotheque", label: "Bibliothèque", icon: Inbox },
    { id: "vueClasse", label: "Vue par Classe", icon: School },
    { id: "suivi", label: "Suivi pédagogique", icon: BadgeCheck },
    { id: "classes", label: "Classes", icon: School },
    { id: "matieres", label: "Matières", icon: FileText },
    { id: "frais", label: "Frais scolaires", icon: Wallet },
    { id: "annee", label: "Année scolaire", icon: CalendarClock },
    { id: "personnel", label: "Personnel", icon: Users },
    { id: "messagePublic", label: "Message Public", icon: Megaphone },
    { id: "messageInterne", label: "Message Interne", icon: MessageSquare },
    { id: "messagesParents", label: "Messages parents", icon: MessageSquare },
    { id: "parametres", label: "Paramètres", icon: Settings },
  ];

  return (
    <Coquille role="directeur" roleLabel="Espace Administratif" nav={nav} actif={onglet} setActif={setOnglet}
              onQuitter={() => {}}>
      {onglet === "dashboard" && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Élèves inscrits" value={stats.total} tone="ardoise" />
            <Stat label="Classes actives" value={classes.length} tone="ardoise" />
            <Stat label="Frais dus" value={`${stats.dus.toLocaleString("fr-FR")} F`} tone="or" />
            <Stat label="Demandes en attente" value={enAttente} tone="or" />
          </div>
          <Panel title="Identité de l'établissement" icon={ShieldCheck}
                 actions={<Btn variant="ghost" icon={Settings} small onClick={() => setOnglet("parametres")}>Modifier</Btn>}>
            <div className="grid grid-cols-2 gap-3 text-[15px] sm:grid-cols-3" style={{ color: "#3E3625" }}>
              <div><span style={{ color: "#9A8B67" }}>Nom : </span>{ecole.nom}</div>
              <div><span style={{ color: "#9A8B67" }}>Année scolaire : </span>{anneeScolaire}</div>
              <div><span style={{ color: "#9A8B67" }}>Quartier : </span>{ecole.quartier}</div>
              <div><span style={{ color: "#9A8B67" }}>Commune : </span>{ecole.commune}</div>
              <div><span style={{ color: "#9A8B67" }}>Département : </span>{ecole.departement}</div>
              <div><span style={{ color: "#9A8B67" }}>Directeur : </span>{ecole.directeur}</div>
              <div><span style={{ color: "#9A8B67" }}>Téléphone : </span>{ecole.telephone}</div>
            </div>
          </Panel>
        </>
      )}


      {onglet === "vueClasse" && (
        <Panel title="Vue par Classe - Toutes les infos Parents" icon={School}>
          <div className="mb-4 flex gap-2 overflow-x-auto">
            {classes.map((cl)=><button key={cl} onClick={()=>setClasseVue(cl)} className={`px-3 py-1.5 rounded-full text-[13px] ${classeVue===cl?"bg-[#1B2A4A] text-white":"bg-[#F1ECDD]"}`}>{cl}</button>)}
          </div>
          {(() => {
            const elevesClasse = eleves.filter((e)=>e.classe===classeVue);
            const totalPaye = elevesClasse.reduce((s,e)=>s+e.frais.reduce((a,f)=>a+f.paye,0),0);
            const totalDu = elevesClasse.reduce((s,e)=>s+e.frais.reduce((a,f)=>a+f.du,0),0);
            return (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-lg p-3" style={{background:"#F1ECDD"}}>Eleves: <b>{elevesClasse.length}</b></div>
                  <div className="rounded-lg p-3" style={{background:"#E4EEE3"}}>Notes: <b>{elevesClasse.reduce((s,e)=>s+e.notes.length,0)}</b></div>
                  <div className="rounded-lg p-3" style={{background:"#FBF0D2"}}>Frais: <b>{totalPaye}/{totalDu}F</b></div>
                </div>
                {elevesClasse.map((e)=><div key={e.id} className="border rounded p-2" style={{borderColor:"#E7DEC8"}}><div className="font-bold">{e.prenom} {e.nom} - {e.id}</div><div className="text-[13px]">Notes: {e.notes.length} | Absences: {e.absences.length} | Paye: {e.frais.reduce((a,f)=>a+f.paye,0)}F</div></div>)}
              </div>
            );
          })()}
        </Panel>
      )}

      {onglet === "bibliotheque" && (
        <Panel title="Bibliothèque des demandes d'inscription" icon={Inbox}>
          {confirmationValidation && (
            <div className="mb-4 flex items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-[15px]"
                 style={{ background: "#E4EEE3", color: "#2F5233" }}>
              <span className="flex items-center gap-2">
                <CheckCircle2 size={15} />
                {confirmationValidation.nom} inscrit(e) — code élève :{" "}
                <span className="font-mono font-semibold">{confirmationValidation.code}</span>
              </span>
              <button onClick={() => setConfirmationValidation(null)} className="text-[13px] underline underline-offset-2">Fermer</button>
            </div>
          )}
          {confirmationValidation && (
            <p className="mb-4 -mt-2 text-[13px]" style={{ color: "#9A8B67" }}>
              Ce code n'est pas transmis automatiquement au parent — communique-le toi-même une fois prêt. Retrouve tous les codes à tout moment dans l'onglet Classes.
            </p>
          )}
          <div className="space-y-3">
            {demandes.length === 0 && (
              <p className="text-[15px]" style={{ color: "#9A8B67" }}>Aucune demande reçue pour le moment.</p>
            )}
            {demandes.map((d) => (
              <div key={d.id} className="rounded-lg border p-4" style={{ borderColor: "#E7DEC8" }}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-medium text-[15px]" style={{ color: "#1B2A4A" }}>
                      {d.prenom} {d.nom} <span className="font-normal" style={{ color: "#9A8B67" }}>({d.sexe === "F" ? "Féminin" : d.sexe === "M" ? "Masculin" : "—"}{d.age != null ? `, ${d.age} ans` : ""})</span>
                    </div>
                    <div className="mt-0.5 text-[13px]" style={{ color: "#5C5240" }}>
                      Classe souhaitée : {d.classeSouhaitee} · Parrain : {d.parrainNom} ({d.parrainTelephone}) · {d.origine === "secretariat" ? "saisie au secrétariat" : "inscription en ligne"}
                    </div>
                    {d.message && <p className="mt-1 text-[13px] italic" style={{ color: "#9A8B67" }}>« {d.message} »</p>}
                  </div>
                  {d.statut === "en_attente" && <Badge tone="or">En attente</Badge>}
                  {d.statut === "validee" && <Badge tone="vert"><CheckCircle2 size={12} />Validée</Badge>}
                  {d.statut === "refusee" && <Badge tone="ardoise"><XCircle size={12} />Refusée</Badge>}
                </div>
                {d.statut === "en_attente" && (
                  <div className="mt-3 flex gap-2">
                    <Btn variant="gold" icon={CheckCircle2} small onClick={() => valider(d)}>Valider l'inscription</Btn>
                    <Btn variant="danger" icon={XCircle} small onClick={() => refuser(d)}>Refuser</Btn>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Panel>
      )}

      {onglet === "suivi" && (
        <Panel title="Suivi pédagogique" icon={BadgeCheck}>
          <p className="mb-4 text-[13px]" style={{ color: "#9A8B67" }}>
            Vérifie à tout moment, depuis chez toi, si chaque enseignant transmet bien les notes et absences à ses élèves — sans avoir besoin de l'appeler.
          </p>
          <div className="space-y-2">
            {suiviParClasse.map((s) => (
              <div key={s.classe} className="rounded-lg border px-4 py-3" style={{ borderColor: "#E7DEC8" }}>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-serif text-[16px]" style={{ color: "#1B2A4A" }}>{s.classe}</span>
                    <span className="ml-2 text-[13px]" style={{ color: "#9A8B67" }}>
                      {s.enseignant ? s.enseignant.nom : "Aucun enseignant affecté"}
                    </span>
                  </div>
                  <Badge tone={s.nbEleves === 0 ? "ardoise" : s.totalNotes > 0 ? "vert" : "or"}>
                    {s.nbEleves === 0 ? "Aucun élève" : s.totalNotes > 0 ? "Actif" : "Aucune note saisie"}
                  </Badge>
                </div>
                <div className="mt-2 grid grid-cols-3 gap-2 text-[13px]" style={{ color: "#5C5240" }}>
                  <div>{s.nbEleves} élève{s.nbEleves > 1 ? "s" : ""}</div>
                  <div>{s.totalNotes} note{s.totalNotes > 1 ? "s" : ""} saisie{s.totalNotes > 1 ? "s" : ""}</div>
                  <div>{s.totalAbsences} absence{s.totalAbsences > 1 ? "s" : ""}</div>
                </div>
                {s.derniereSaisie && (
                  <div className="mt-1 text-[12px]" style={{ color: "#9A8B67" }}>Dernière note saisie le {s.derniereSaisie}</div>
                )}
              </div>
            ))}
          </div>
        </Panel>
      )}

      {onglet === "classes" && (
        <Panel title="Gestion des classes" icon={School}>
          <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {classes.map((c, i) => {
              const inscrits = eleves.filter((e) => e.classe === c);
              return (
                <div key={i} className="rounded-lg border px-3 py-2 text-[15px]" style={{ borderColor: "#E7DEC8" }}>
                  <div className="flex items-center justify-between gap-2">
                    {classeEnEdition === i ? (
                      <input
                        autoFocus
                        defaultValue={c}
                        onBlur={(ev) => { renommerClasse(i, ev.target.value); setClasseEnEdition(null); }}
                        onKeyDown={(ev) => { if (ev.key === "Enter") ev.target.blur(); }}
                        className="min-w-0 flex-1 rounded border px-2 py-1 outline-none"
                        style={{ borderColor: "#C9A227", color: "#1B2A4A" }}
                      />
                    ) : (
                      <span style={{ color: "#1B2A4A" }} className="font-medium">{c}</span>
                    )}
                    <div className="flex shrink-0 items-center gap-2">
                      <Badge tone="ardoise">{inscrits.length} inscrit{inscrits.length > 1 ? "s" : ""}</Badge>
                      <Pencil size={14} className="cursor-pointer hover:opacity-70" style={{ color: "#9A8B67" }}
                              onClick={() => setClasseEnEdition(i)} />
                      <Trash2 size={14} className="cursor-pointer hover:opacity-70"
                              style={{ color: "#8A2E2E" }}
                              onClick={() => supprimerClasse(i)} />
                    </div>
                  </div>
                  {inscrits.length > 0 && (
                    <details className="mt-1.5">
                      <summary className="cursor-pointer text-[13px]" style={{ color: "#9A8B67" }}>Voir les codes élèves</summary>
                      <div className="mt-1 space-y-0.5">
                        {inscrits.map((e) => (
                          <div key={e.id} className="flex items-center justify-between text-[13px]">
                            <span style={{ color: "#5C5240" }}>{e.prenom} {e.nom}</span>
                            <span className="font-mono" style={{ color: "#1B2A4A" }}>{e.id}</span>
                          </div>
                        ))}
                      </div>
                    </details>
                  )}
                  {classeASupprimer === i && (
                    <div className="mt-2 flex items-center justify-between gap-2 rounded-md px-2.5 py-1.5 text-[13px]" style={{ background: "#FBEAEA" }}>
                      <span style={{ color: "#8A2E2E" }}>{inscrits.length} élève(s) dans cette classe. Supprimer quand même ?</span>
                      <div className="flex shrink-0 gap-2">
                        <button onClick={() => supprimerClasse(i)} className="font-medium underline" style={{ color: "#8A2E2E" }}>Oui, supprimer</button>
                        <button onClick={() => setClasseASupprimer(null)} style={{ color: "#5C5240" }}>Annuler</button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="flex gap-2 rounded-lg px-3 py-2" style={{ background: "#F1ECDD" }}>
            <input
              value={nouvelleClasse}
              onChange={(e) => setNouvelleClasse(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") ajouterClasse(); }}
              placeholder="Ex. 6ème, CI bis, Maternelle 3..."
              className="w-full rounded-lg border px-3 py-2 text-[15px] outline-none"
              style={{ borderColor: "#E7DEC8" }}
            />
            <Btn variant="gold" icon={Plus} onClick={ajouterClasse}>Ajouter</Btn>
          </div>
          <p className="mt-2 text-[13px]" style={{ color: "#9A8B67" }}>Clique sur le crayon pour renommer une classe, ou sur la corbeille pour la supprimer. Le champ ci-dessus reste libre pour ajouter d'autres niveaux à tout moment. Déplie « Voir les codes élèves » pour retrouver le code à communiquer à chaque parent.</p>
        </Panel>
      )}

      {onglet === "matieres" && (
        <Panel title="Matières par classe" icon={FileText}>
          <p className="mb-4 text-[13px]" style={{ color: "#9A8B67" }}>
            Chaque classe a sa propre liste de matières. Ouvre une classe, ajoute ses matières — elles s'afficheront automatiquement sur la page de chaque élève inscrit dans cette classe.
          </p>
          <div className="space-y-3">
            {classes.map((c) => {
              const matieresClasse = matieresParClasse[c] || [];
              const saisie = nouvellesMatieresParClasse[c] || { nom: "", coef: 1 };
              return (
                <details key={c} className="rounded-lg border px-4 py-3" style={{ borderColor: "#E7DEC8" }} open={matieresClasse.length > 0}>
                  <summary className="flex cursor-pointer items-center justify-between">
                    <span className="font-serif text-[16px]" style={{ color: "#1B2A4A" }}>{c}</span>
                    <Badge tone={matieresClasse.length > 0 ? "vert" : "ardoise"}>
                      {matieresClasse.length} matière{matieresClasse.length > 1 ? "s" : ""}
                    </Badge>
                  </summary>

                  <div className="mt-3 space-y-2">
                    {matieresClasse.length === 0 && (
                      <p className="text-[13px]" style={{ color: "#9A8B67" }}>Aucune matière définie pour {c} — ajoute la première ci-dessous.</p>
                    )}
                    {matieresClasse.map((m, i) => (
                      <div key={i} className="flex flex-wrap items-center gap-2 rounded-lg border px-3 py-2"
                           style={{ borderColor: "#E7DEC8" }}>
                        <input
                          defaultValue={m.nom}
                          onBlur={(ev) => modifierMatiereClasse(c, i, "nom", ev.target.value)}
                          className="min-w-0 flex-1 rounded border px-2 py-1 text-[15px] outline-none"
                          style={{ borderColor: "#E7DEC8", color: "#1B2A4A" }}
                        />
                        <div className="flex items-center gap-1 text-[13px]" style={{ color: "#9A8B67" }}>
                          Coef.
                          <input
                            type="number" min={1} max={5} defaultValue={m.coef}
                            onBlur={(ev) => modifierMatiereClasse(c, i, "coef", ev.target.value)}
                            className="w-12 rounded border px-1 py-1 text-center outline-none"
                            style={{ borderColor: "#E7DEC8" }}
                          />
                        </div>
                        <Trash2 size={15} className="cursor-pointer" style={{ color: "#8A2E2E" }}
                                onClick={() => supprimerMatiereClasse(c, i)} />
                      </div>
                    ))}
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-2 rounded-lg px-3 py-2" style={{ background: "#F1ECDD" }}>
                    <input
                      value={saisie.nom}
                      onChange={(ev) => champNouvelleMatiere(c, "nom", ev.target.value)}
                      placeholder={`Nouvelle matière pour ${c}`}
                      className="min-w-0 flex-1 rounded border px-2 py-1.5 text-[15px] outline-none"
                      style={{ borderColor: "#E7DEC8" }}
                    />
                    <div className="flex items-center gap-1 text-[13px]" style={{ color: "#5C5240" }}>
                      Coef.
                      <input
                        type="number" min={1} max={5}
                        value={saisie.coef}
                        onChange={(ev) => champNouvelleMatiere(c, "coef", ev.target.value)}
                        className="w-12 rounded border px-1 py-1.5 text-center outline-none"
                        style={{ borderColor: "#E7DEC8" }}
                      />
                    </div>
                    <Btn variant="gold" icon={Plus} small onClick={() => ajouterMatiereClasse(c)}>Ajouter à {c}</Btn>
                  </div>
                </details>
              );
            })}
          </div>
        </Panel>
      )}

      {onglet === "frais" && (
        <Panel title="Frais scolaires" icon={Wallet}
               actions={<Badge tone="ardoise">Année {anneeScolaire}</Badge>}>
          <p className="mb-3 text-[13px]" style={{ color: "#9A8B67" }}>
            Ce catalogue s'applique automatiquement à chaque nouvel élève validé pour l'année {anneeScolaire}. Pour démarrer une nouvelle année scolaire (avec archivage des résultats), utilise l'onglet « Année scolaire ».
          </p>
          <div className="mb-4 space-y-2">
            {fraisTypes.map((f, i) => (
              <div key={i} className="flex items-center gap-2 rounded-lg border px-3 py-2" style={{ borderColor: "#E7DEC8" }}>
                <input
                  defaultValue={f.libelle}
                  onBlur={(ev) => modifierFrais(i, "libelle", ev.target.value)}
                  className="min-w-0 flex-1 rounded border px-2 py-1 text-[15px] outline-none"
                  style={{ borderColor: "#E7DEC8", color: "#1B2A4A" }}
                />
                <div className="flex items-center gap-1 text-[13px]" style={{ color: "#9A8B67" }}>
                  Montant
                  <input
                    type="number" min={0} defaultValue={f.montant}
                    onBlur={(ev) => modifierFrais(i, "montant", ev.target.value)}
                    className="w-24 rounded border px-2 py-1 text-right outline-none"
                    style={{ borderColor: "#E7DEC8" }}
                  />
                  F
                </div>
                <Trash2 size={15} className="cursor-pointer" style={{ color: "#8A2E2E" }}
                        onClick={() => supprimerFrais(i)} />
              </div>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2 rounded-lg px-3 py-2" style={{ background: "#F1ECDD" }}>
            <input
              value={nouveauFrais.libelle}
              onChange={(e) => setNouveauFrais({ ...nouveauFrais, libelle: e.target.value })}
              placeholder="Ex. Cantine, Transport, Sortie pédagogique..."
              className="min-w-0 flex-1 rounded border px-2 py-1.5 text-[15px] outline-none"
              style={{ borderColor: "#E7DEC8" }}
            />
            <input
              type="number" min={0}
              value={nouveauFrais.montant}
              onChange={(e) => setNouveauFrais({ ...nouveauFrais, montant: e.target.value })}
              placeholder="Montant"
              className="w-24 rounded border px-2 py-1.5 text-right text-[15px] outline-none"
              style={{ borderColor: "#E7DEC8" }}
            />
            <Btn variant="gold" icon={Plus} small onClick={ajouterFrais}>Ajouter</Btn>
          </div>
        </Panel>
      )}

      {onglet === "annee" && (
        <Panel title="Année scolaire" icon={CalendarClock}>
          <div className="mb-4 rounded-lg border px-4 py-3" style={{ borderColor: "#E7DEC8" }}>
            <div className="text-[13px]" style={{ color: "#9A8B67" }}>Année en cours</div>
            <div className="font-serif text-xl" style={{ color: "#1B2A4A" }}>{anneeScolaire}</div>
          </div>

          {confirmationCloture && (
            <div className="mb-4 rounded-lg px-3 py-2.5 text-[15px]" style={{ background: "#E4EEE3", color: "#2F5233" }}>
              <CheckCircle2 size={15} className="mr-1 inline" />
              Année {confirmationCloture.ancienneAnnee} archivée ({confirmationCloture.nbEleves} élève{confirmationCloture.nbEleves > 1 ? "s" : ""}) — nouvelle année {confirmationCloture.nouvelleAnnee} démarrée, dossiers vierges.
            </div>
          )}

          <div className="rounded-lg p-4" style={{ background: "#F1ECDD" }}>
            <p className="mb-2 text-[15px]" style={{ color: "#3E3625" }}>
              Clôturer l'année en cours archive les notes, absences et frais de tous les élèves (consultables ensuite ci-dessous), puis ouvre une nouvelle année scolaire : chaque élève garde sa fiche (nom, classe, parrain) mais repart avec des notes, absences et frais vierges, calculés sur le catalogue de frais actuel.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <input
                value={nouvelleAnneeLabel}
                onChange={(e) => { setNouvelleAnneeLabel(e.target.value); setErreurCloture(""); setDemandeConfirmationCloture(false); }}
                placeholder="Ex. 2027-2028"
                className="w-40 rounded-lg border px-3 py-2 text-[15px] outline-none"
                style={{ borderColor: erreurCloture ? "#8A2E2E" : "#E7DEC8" }}
              />
              {!demandeConfirmationCloture ? (
                <Btn variant="gold" icon={RefreshCw} onClick={demarrerCloture}>Clôturer et démarrer cette nouvelle année</Btn>
              ) : (
                <>
                  <span className="text-[13px] font-medium" style={{ color: "#8A2E2E" }}>Confirmer la clôture de {anneeScolaire} ?</span>
                  <Btn variant="danger" small onClick={cloturerAnnee}>Oui, clôturer</Btn>
                  <Btn variant="ghost" small onClick={() => setDemandeConfirmationCloture(false)}>Annuler</Btn>
                </>
              )}
            </div>
            {erreurCloture && <p className="mt-1.5 text-[13px]" style={{ color: "#8A2E2E" }}>{erreurCloture}</p>}
          </div>

          {anneesArchivees.length > 0 && (
            <div className="mt-5">
              <h4 className="mb-2 text-[13px] font-medium uppercase tracking-wide" style={{ color: "#9A8B67" }}>Années archivées</h4>
              <div className="space-y-2">
                {anneesArchivees.map((arch, i) => (
                  <details key={i} className="rounded-lg border px-4 py-2.5" style={{ borderColor: "#E7DEC8" }}>
                    <summary className="flex cursor-pointer items-center justify-between text-[15px]">
                      <span className="font-medium" style={{ color: "#1B2A4A" }}>{arch.annee}</span>
                      <Badge tone="ardoise">{arch.eleves.length} élève{arch.eleves.length > 1 ? "s" : ""}</Badge>
                    </summary>
                    <div className="mt-2 space-y-1">
                      {arch.eleves.map((e) => {
                        const moy = e.notes.length ? Math.round((e.notes.reduce((s, n) => s + n.note20, 0) / e.notes.length) * 10) / 10 : null;
                        return (
                          <div key={e.id} className="flex items-center justify-between text-[13px]" style={{ color: "#5C5240" }}>
                            <span>{e.prenom} {e.nom} — {e.classe}</span>
                            <span>{moy !== null ? `${moy}/20` : "—"}</span>
                          </div>
                        );
                      })}
                    </div>
                  </details>
                ))}
              </div>
            </div>
          )}
        </Panel>
      )}

      {onglet === "personnel" && (
        <Panel title="Informations du personnel" icon={Users}>
          <div className="mb-4 space-y-2">
            {personnel.map((p, i) => (
              <div key={i} className="rounded-lg border p-3" style={{ borderColor: "#E7DEC8" }}>
                {personnelEnEdition === i ? (
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <Champ label="Nom" value={p.nom} onChange={(e) => modifierPersonnel(i, "nom", e.target.value)} />
                    <div>
                      <label className="mb-1 block text-[13px] font-medium" style={{ color: "#5C5240" }}>Poste</label>
                      <select
                        value={p.poste}
                        onChange={(e) => modifierPersonnel(i, "poste", e.target.value)}
                        className="w-full rounded-lg border px-3 py-2 text-[15px] outline-none"
                        style={{ borderColor: "#E7DEC8" }}
                      >
                        <option>Directeur</option>
                        <option>Enseignant</option>
                        <option>Enseignante</option>
                        <option>Secrétaire</option>
                        <option>Gestionnaire</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-[13px] font-medium" style={{ color: "#5C5240" }}>Classe affectée</label>
                      <select
                        value={p.classe}
                        onChange={(e) => modifierPersonnel(i, "classe", e.target.value)}
                        className="w-full rounded-lg border px-3 py-2 text-[15px] outline-none"
                        style={{ borderColor: "#E7DEC8" }}
                      >
                        <option value="—">— (aucune)</option>
                        {classes.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <Champ label="Téléphone" value={p.telephone} onChange={(e) => modifierPersonnel(i, "telephone", e.target.value)} />
                    <div className="flex items-end">
                      <Btn variant="gold" small onClick={() => setPersonnelEnEdition(null)}>Terminer</Btn>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between text-[15px]">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full" style={{ background: "#E6EAF2" }}>
                        <UserCircle2 size={16} style={{ color: "#1B2A4A" }} />
                      </div>
                      <div>
                        <div className="font-medium" style={{ color: "#1B2A4A" }}>{p.nom}</div>
                        <div className="text-[13px]" style={{ color: "#9A8B67" }}>{p.poste} — {p.classe}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[13px]" style={{ color: "#5C5240" }}>{p.telephone}</span>
                      <Pencil size={14} className="cursor-pointer" style={{ color: "#9A8B67" }} onClick={() => setPersonnelEnEdition(i)} />
                      <Trash2 size={14} className="cursor-pointer" style={{ color: "#8A2E2E" }} onClick={() => supprimerPersonnel(i)} />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 gap-2 rounded-lg p-3 sm:grid-cols-2" style={{ background: "#F1ECDD" }}>
            <Champ label="Nom" value={nouveauPersonnel.nom} onChange={(e) => setNouveauPersonnel({ ...nouveauPersonnel, nom: e.target.value })} />
            <div>
              <label className="mb-1 block text-[13px] font-medium" style={{ color: "#5C5240" }}>Poste</label>
              <select
                value={nouveauPersonnel.poste}
                onChange={(e) => setNouveauPersonnel({ ...nouveauPersonnel, poste: e.target.value })}
                className="w-full rounded-lg border px-3 py-2 text-[15px] outline-none"
                style={{ borderColor: "#E7DEC8" }}
              >
                <option>Enseignant</option>
                <option>Enseignante</option>
                <option>Secrétaire</option>
                <option>Gestionnaire</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[13px] font-medium" style={{ color: "#5C5240" }}>Classe affectée</label>
              <select
                value={nouveauPersonnel.classe}
                onChange={(e) => setNouveauPersonnel({ ...nouveauPersonnel, classe: e.target.value })}
                className="w-full rounded-lg border px-3 py-2 text-[15px] outline-none"
                style={{ borderColor: "#E7DEC8" }}
              >
                <option value="—">— (aucune)</option>
                {classes.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <Champ label="Téléphone" value={nouveauPersonnel.telephone} onChange={(e) => setNouveauPersonnel({ ...nouveauPersonnel, telephone: e.target.value })} />
            <div className="sm:col-span-2">
              <Btn variant="gold" icon={Plus} onClick={ajouterPersonnel}>Ajouter ce membre du personnel</Btn>
            </div>
          </div>
          <p className="mt-2 text-[13px]" style={{ color: "#9A8B67" }}>
            Si un enseignant est remplacé ou change de classe, clique sur le crayon pour modifier sa fiche directement — sa nouvelle classe sera reflétée automatiquement dans l'espace Parent.
          </p>
        </Panel>
      )}

      {(onglet === "annonces" || onglet === "messagePublic") && (
        <Panel title="Publier une annonce" icon={Megaphone}>
          <div className="mb-4 flex gap-2">
            <input
              value={nouvelleAnnonce}
              onChange={(e) => setNouvelleAnnonce(e.target.value)}
              placeholder="Ex. Congés de Noël le 20 décembre"
              className="w-full rounded-lg border px-3 py-2 text-[15px] outline-none"
              style={{ borderColor: "#E7DEC8" }}
            />
            <Btn variant="primary" icon={Plus} onClick={() => {
              if (!nouvelleAnnonce.trim()) return;
              setAnnonces([{ titre: nouvelleAnnonce, texte: nouvelleAnnonce, date: "aujourd'hui" }, ...annonces]);
              setNouvelleAnnonce("");
            }}>Publier</Btn>
          </div>
          <div className="space-y-2">
            {annonces.map((a, i) => (
              <div key={i} className="rounded-lg border px-4 py-2.5" style={{ borderColor: "#E7DEC8" }}>
                {annonceEnEdition === i ? (
                  <div className="space-y-2">
                    <input
                      defaultValue={a.titre}
                      onBlur={(ev) => modifierAnnonce(i, "titre", ev.target.value)}
                      className="w-full rounded border px-2 py-1 text-[15px] font-medium outline-none"
                      style={{ borderColor: "#C9A227", color: "#1B2A4A" }}
                    />
                    <textarea
                      defaultValue={a.texte}
                      onBlur={(ev) => modifierAnnonce(i, "texte", ev.target.value)}
                      rows={2}
                      className="w-full rounded border px-2 py-1 text-[15px] outline-none"
                      style={{ borderColor: "#C9A227", color: "#5C5240" }}
                    />
                    <Btn variant="gold" small onClick={() => setAnnonceEnEdition(null)}>Terminer</Btn>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-[15px]" style={{ color: "#1B2A4A" }}>{a.titre}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[13px]" style={{ color: "#9A8B67" }}>{a.date}</span>
                        <Pencil size={13} className="cursor-pointer" style={{ color: "#9A8B67" }} onClick={() => setAnnonceEnEdition(i)} />
                        <Trash2 size={13} className="cursor-pointer" style={{ color: "#8A2E2E" }} onClick={() => supprimerAnnonce(i)} />
                      </div>
                    </div>
                    <p className="mt-1 text-[15px]" style={{ color: "#5C5240" }}>{a.texte}</p>
                  </>
                )}
              </div>
            ))}
          </div>
          <p className="mt-2 text-[13px]" style={{ color: "#9A8B67" }}>Ces annonces sont aussi visibles et modifiables depuis l'espace Secrétaire — tous les parents les voient au même endroit.</p>
        </Panel>
      )}

      {(onglet === "messages" || onglet === "messageInterne") && (
        <Panel title="Messagerie administrative" icon={MessageSquare}>
          <div className="mb-4 rounded-lg p-3" style={{ background: "#F1ECDD" }}>
            <label className="mb-1 block text-[13px] font-medium" style={{ color: "#5C5240" }}>Destinataire</label>
            <select
              value={nouveauMessageInterne.destinataire}
              onChange={(e) => setNouveauMessageInterne({ ...nouveauMessageInterne, destinataire: e.target.value })}
              className="mb-2 w-full rounded-lg border px-3 py-2 text-[15px] outline-none"
              style={{ borderColor: "#E7DEC8" }}
            >
              <option value="tous">Tout le personnel</option>
              {personnel.map((p, i) => (
                <option key={i} value={p.nom}>{p.nom} ({p.poste})</option>
              ))}
            </select>
            <textarea
              value={nouveauMessageInterne.texte}
              onChange={(e) => setNouveauMessageInterne({ ...nouveauMessageInterne, texte: e.target.value })}
              rows={3}
              placeholder="Écris ton message ici..."
              className="w-full rounded-lg border px-3 py-2 text-[15px] outline-none"
              style={{ borderColor: "#E7DEC8" }}
            />
            <div className="mt-2 flex justify-end">
              <Btn variant="gold" icon={Send} onClick={envoyerMessageInterne}>Envoyer</Btn>
            </div>
          </div>

          <div className="space-y-2">
            {messagesInternes.length === 0 && <p className="text-[15px]" style={{ color: "#9A8B67" }}>Aucun message envoyé pour le moment.</p>}
            {messagesInternes.map((m, i) => (
              <div key={i} className="rounded-lg border px-4 py-2.5 text-[15px]" style={{ borderColor: "#E7DEC8" }}>
                {messageInterneEnEdition === i ? (
                  <div className="space-y-2">
                    <textarea
                      defaultValue={m.texte}
                      onBlur={(ev) => modifierMessageInterne(i, ev.target.value)}
                      rows={2}
                      className="w-full rounded border px-2 py-1 text-[15px] outline-none"
                      style={{ borderColor: "#C9A227", color: "#3E3625" }}
                    />
                    <Btn variant="gold" small onClick={() => setMessageInterneEnEdition(null)}>Terminer</Btn>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <Badge tone={m.destinataire === "tous" ? "or" : "ardoise"}>
                        {m.destinataire === "tous" ? "Tout le personnel" : m.destinataire}
                      </Badge>
                      <div className="flex items-center gap-2">
                        <span className="text-[13px]" style={{ color: "#9A8B67" }}>{m.date}</span>
                        <Pencil size={13} className="cursor-pointer" style={{ color: "#9A8B67" }} onClick={() => setMessageInterneEnEdition(i)} />
                        <Trash2 size={13} className="cursor-pointer" style={{ color: "#8A2E2E" }} onClick={() => supprimerMessageInterne(i)} />
                      </div>
                    </div>
                    <p className="mt-1" style={{ color: "#5C5240" }}>{m.texte}</p>
                  </>
                )}
              </div>
            ))}
          </div>
        </Panel>
      )}

      {onglet === "messagesParents" && (
        <Panel title="Messages reçus des parents" icon={MessageSquare}>
          <p className="mb-4 text-[13px]" style={{ color: "#9A8B67" }}>
            Tout message envoyé par un parent depuis l'espace Parent arrive ici, directement à l'administration.
          </p>
          <div className="space-y-3">
            {messagesParents.length === 0 && <p className="text-[15px]" style={{ color: "#9A8B67" }}>Aucun message reçu pour le moment.</p>}
            {messagesParents.map((m, i) => (
              <div key={i} className="rounded-lg border px-4 py-3" style={{ borderColor: "#E7DEC8" }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-[15px]" style={{ color: "#1B2A4A" }}>{m.nomEleve}</span>
                    <Badge tone="ardoise">{m.classe}</Badge>
                    {!m.lu && <Badge tone="or">Non lu</Badge>}
                  </div>
                  <span className="text-[13px]" style={{ color: "#9A8B67" }}>{m.date}</span>
                </div>
                <p className="mt-1.5 text-[15px]" style={{ color: "#5C5240" }}>{m.texte}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {!m.lu && <Btn variant="ghost" small onClick={() => marquerLu(i)}>Marquer comme lu</Btn>}
                  <input
                    value={reponseParent[i] || ""}
                    onChange={(ev) => setReponseParent((prev) => ({ ...prev, [i]: ev.target.value }))}
                    placeholder="Répondre à ce parent..."
                    className="min-w-0 flex-1 rounded border px-2 py-1.5 text-[13px] outline-none"
                    style={{ borderColor: "#E7DEC8" }}
                  />
                  <Btn variant="gold" icon={Send} small onClick={() => repondreParent(i, m)}>Répondre</Btn>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {onglet === "parametres" && (
        <>
          <Panel title="Paramètres de l'établissement" icon={Settings}>
            <div className="mb-4 flex items-center gap-4">
              <Embleme logoUrl={ecole.logoUrl} taille={64} iconTaille={28} />
              <div className="flex-1">
                <Champ label="Lien (URL) du logo de l'école" value={ecole.logoUrl} onChange={champEcole("logoUrl")} placeholder="https://... (image hébergée en ligne)" />
                <p className="mt-1 text-[13px]" style={{ color: "#9A8B67" }}>
                  Héberge ton logo quelque part (Google Drive en partage public, imgur, ton site...) puis colle le lien direct de l'image ici. Laisse vide pour garder l'icône par défaut.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Champ label="Nom complet de l'école" value={ecole.nom} onChange={champEcole("nom")} />
              <Champ label="Sigle / Nom commercial" value={ecole.sigle} onChange={champEcole("sigle")} />
              <Champ label="Quartier" value={ecole.quartier} onChange={champEcole("quartier")} />
              <Champ label="Commune" value={ecole.commune} onChange={champEcole("commune")} />
              <Champ label="Département" value={ecole.departement} onChange={champEcole("departement")} />
              <Champ label="Nom du directeur" value={ecole.directeur} onChange={champEcole("directeur")} />
              <Champ label="Téléphone de l'école" value={ecole.telephone} onChange={champEcole("telephone")} />
              <Champ label="Téléphone du directeur (affiché en page de garde)" value={ecole.telephoneDirecteur} onChange={champEcole("telephoneDirecteur")} />
              <Champ label="Email de l'école" value={ecole.email} onChange={champEcole("email")} />
              <Champ label="Devise de l'école" value={ecole.devise} onChange={champEcole("devise")} />
            </div>
            <p className="mt-3 text-[13px]" style={{ color: "#9A8B67" }}>Chaque champ s'enregistre automatiquement dès que tu quittes la case — ces informations apparaissent sur l'écran de connexion et la page d'inscription en ligne.</p>
          </Panel>

          <div className="h-4" />

          <Panel title="Codes d'accès du personnel" icon={KeyRound}>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Champ label="Code Directeur" value={codes.directeur} onChange={champCode("directeur")} />
              <Champ label="Code Enseignant" value={codes.enseignant} onChange={champCode("enseignant")} />
              <Champ label="Code Secrétaire" value={codes.secretaire} onChange={champCode("secretaire")} />
            </div>
            <p className="mt-3 text-[13px]" style={{ color: "#9A8B67" }}>
              Chaque membre du personnel entre ce code sur l'écran de connexion pour accéder à son espace. Le code d'un parent est différent : c'est le code élève (CSPxxxx) généré à la validation de son inscription — retrouvable dans l'onglet Classes.
            </p>
          </Panel>
        </>
      )}
    </Coquille>
  );
}

/* ------------------------------------------------------------------
   ESPACE ENSEIGNANT
------------------------------------------------------------------- */

function EspaceEnseignant({ eleves, setEleves }) {
  const { matieresParClasse, setMatieresParClasse, classes, setMessagesInternes } = useEcole();
  const [onglet, setOnglet] = useState("classe");
  const [maClasse, setMaClasse] = useState(classes[0] || "CM1");
  const mesEleves = eleves.filter((e) => e.classe === maClasse);
  const matieres = matieresParClasse[maClasse] || [];

  // --- Notes : ajout, correction, suppression ---
  const [nouvelleNote, setNouvelleNote] = useState({}); // { [eleveId]: { evaluation, mois } } — session de saisie partagée pour toutes les matières
  const [saisieRapide, setSaisieRapide] = useState({}); // { [eleveId]: { [matiere]: valeur } }
  const [confirmation, setConfirmation] = useState(null); // message de confirmation temporaire
  const [cleActualisation, setCleActualisation] = useState(0); // force le rafraîchissement visuel de la page

  const champNouvelleNote = (eleveId, cle, valeur) => {
    setNouvelleNote((prev) => ({
      ...prev,
      [eleveId]: { evaluation: "Évaluation 2", mois: "Septembre", ...prev[eleveId], [cle]: valeur },
    }));
  };

  const champSaisieRapide = (eleveId, matiere, valeur) => {
    setSaisieRapide((prev) => ({
      ...prev,
      [eleveId]: { ...(prev[eleveId] || {}), [matiere]: valeur },
    }));
  };

  const enregistrerNotesMatieres = (eleveId, nomEleve) => {
    const session = nouvelleNote[eleveId] || { evaluation: "Évaluation 2", mois: "Septembre" };
    const valeurs = saisieRapide[eleveId] || {};
    const aRemplir = Object.entries(valeurs).filter(([, v]) => v !== "" && !isNaN(parseFloat(v)));
    if (aRemplir.length === 0) return;
    const dateSaisie = formatDateFr();
    setEleves((prev) => prev.map((el) => el.id === eleveId
      ? { ...el, notes: [...el.notes, ...aRemplir.map(([matiere, v]) => ({
          evaluation: session.evaluation, mois: session.mois, matiere, note20: parseFloat(v), dateSaisie,
        }))] }
      : el));
    setSaisieRapide((prev) => ({ ...prev, [eleveId]: {} }));
    setConfirmation(`${aRemplir.length} note${aRemplir.length > 1 ? "s" : ""} enregistrée${aRemplir.length > 1 ? "s" : ""} pour ${nomEleve}`);
  };

  // --- Appréciation envoyée au parent, à propos de l'évolution de l'enfant ---
  const [appreciationSaisie, setAppreciationSaisie] = useState({}); // { [eleveId]: texte }

  const envoyerAppreciation = (eleveId, nomEleve) => {
    const texte = (appreciationSaisie[eleveId] || "").trim();
    if (!texte) return;
    setEleves((prev) => prev.map((el) => el.id === eleveId ? { ...el, messages: [...el.messages, { auteur: "Enseignant(e)", texte, date: "aujourd'hui" }] } : el));
    setMessagesInternes((prev) => [{ destinataire: "directeur", texte: "Appreciation " + maClasse + " pour " + nomEleve + ": " + texte, date: "aujourd'hui" }, ...prev]);
    setAppreciationSaisie((prev) => ({ ...prev, [eleveId]: "" }));
    setConfirmation("Appreciation envoyee a Parent (" + maClasse + ") + Directeur");
  };

  const corrigerNote = (eleveId, index, val, nomEleve) => {
    if (val === "") return;
    const nb = parseFloat(val);
    if (isNaN(nb)) return;
    setEleves((prev) => prev.map((el) => el.id === eleveId
      ? { ...el, notes: el.notes.map((n, i) => i === index ? { ...n, note20: nb, dateSaisie: formatDateFr() } : n) }
      : el));
    setConfirmation(`Note corrigée pour ${nomEleve}`);
  };

  const supprimerNote = (eleveId, index) => {
    setEleves((prev) => prev.map((el) => el.id === eleveId
      ? { ...el, notes: el.notes.filter((_, i) => i !== index) }
      : el));
  };

  const actualiserPage = () => {
    setConfirmation(null);
    setCleActualisation((k) => k + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // --- Matières de la classe : ajout, modification, suppression ---
  const [nouvelleMatiere, setNouvelleMatiere] = useState({ nom: "", coef: 1 });

  const ajouterMatiere = () => {
    if (!nouvelleMatiere.nom.trim()) return;
    setMatieresParClasse((prev) => ({
      ...prev,
      [maClasse]: [...(prev[maClasse] || []), { nom: nouvelleMatiere.nom.trim(), coef: Number(nouvelleMatiere.coef) || 1 }],
    }));
    setNouvelleMatiere({ nom: "", coef: 1 });
  };

  const modifierMatiere = (index, cle, valeur) => {
    setMatieresParClasse((prev) => ({
      ...prev,
      [maClasse]: (prev[maClasse] || []).map((m, i) => i === index ? { ...m, [cle]: cle === "coef" ? Number(valeur) || 1 : valeur } : m),
    }));
  };

  const supprimerMatiere = (index) => {
    setMatieresParClasse((prev) => ({
      ...prev,
      [maClasse]: (prev[maClasse] || []).filter((_, i) => i !== index),
    }));
  };

  // --- Absences : ajout, suppression ---
  const TYPES_ABSENCE = ["Absence", "Retard", "Permissionnaire", "Malade", "Sans motif"];
  const [nouvelleAbsence, setNouvelleAbsence] = useState({}); // { [eleveId]: { type, date, motif } }

  const champNouvelleAbsence = (eleveId, cle, valeur) => {
    setNouvelleAbsence((prev) => ({
      ...prev,
      [eleveId]: { type: TYPES_ABSENCE[0], date: "", motif: "", ...prev[eleveId], [cle]: valeur },
    }));
  };

  const ajouterAbsence = (eleveId, nomEleve) => {
    const a = nouvelleAbsence[eleveId];
    if (!a || !a.date?.trim()) return;
    setEleves((prev) => prev.map((el) => el.id === eleveId
      ? { ...el, absences: [...el.absences, { date: a.date, type: a.type, motif: a.motif || "" }] }
      : el));
    setNouvelleAbsence((prev) => ({ ...prev, [eleveId]: { type: TYPES_ABSENCE[0], date: "", motif: "" } }));
    setConfirmation(`${a.type} enregistrée pour ${nomEleve} le ${a.date}`);
  };

  const supprimerAbsence = (eleveId, index) => {
    setEleves((prev) => prev.map((el) => el.id === eleveId
      ? { ...el, absences: el.absences.filter((_, i) => i !== index) }
      : el));
  };

  const nav = [
    { id: "classe", label: "Ma classe", icon: Users },
    { id: "notes", label: "Notes & corrections", icon: ClipboardList },
    { id: "absences", label: "Absences", icon: CalendarClock },
    { id: "matieres", label: "Matières", icon: FileText },
  ];

  return (
    <Coquille role="enseignant" roleLabel="Mme Houssou · Enseignante" nav={nav} actif={onglet} setActif={setOnglet}
              onQuitter={() => {}}>
      {onglet === "classe" && (
        <Panel title={`Classe ${maClasse}`} icon={Users}>
          <div className="space-y-2">
            {mesEleves.map((e) => (
              <div key={e.id} className="flex items-center justify-between rounded-lg border px-4 py-2.5"
                   style={{ borderColor: "#E7DEC8" }}>
                <div>
                  <div className="font-medium text-[15px]" style={{ color: "#1B2A4A" }}>{e.prenom} {e.nom}</div>
                  <div className="text-[13px]" style={{ color: "#9A8B67" }}>Code {e.id}</div>
                </div>
                <Badge tone={e.absences.length ? "or" : "vert"}>
                  {e.absences.length} absence{e.absences.length > 1 ? "s" : ""}
                </Badge>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {onglet === "absences" && (
        <Panel title="Présences, absences et retards" icon={CalendarClock}
               actions={confirmation && <Btn variant="ghost" icon={RefreshCw} small onClick={actualiserPage}>Actualiser</Btn>}>
          {confirmation && (
            <div className="mb-4 flex items-center gap-2 rounded-lg px-3 py-2 text-[15px]"
                 style={{ background: "#E4EEE3", color: "#2F5233" }}>
              <CheckCircle2 size={15} />{confirmation}
            </div>
          )}
          <div className="space-y-5">
            {mesEleves.map((e) => {
              const na = nouvelleAbsence[e.id] || { type: TYPES_ABSENCE[0], date: "", motif: "" };
              return (
                <div key={e.id} className="rounded-lg border p-4" style={{ borderColor: "#E7DEC8" }}>
                  <div className="mb-3 font-medium text-[15px]" style={{ color: "#1B2A4A" }}>{e.prenom} {e.nom}</div>

                  {e.absences.length > 0 && (
                    <div className="mb-3 space-y-1.5">
                      {e.absences.map((a, i) => (
                        <div key={i} className="flex flex-wrap items-center gap-2 rounded-md border px-2.5 py-1.5 text-[13px]"
                             style={{ borderColor: "#E7DEC8" }}>
                          <Badge tone={a.type === "Sans motif" ? "or" : "vert"}>{a.type}</Badge>
                          <span style={{ color: "#9A8B67" }}>{a.date}</span>
                          {a.motif && <span style={{ color: "#5C5240" }}>— {a.motif}</span>}
                          <Trash2 size={13} className="ml-auto cursor-pointer" style={{ color: "#8A2E2E" }}
                                  onClick={() => supprimerAbsence(e.id, i)} />
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-2 rounded-md px-2.5 py-2" style={{ background: "#F1ECDD" }}>
                    <select
                      value={na.type}
                      onChange={(ev) => champNouvelleAbsence(e.id, "type", ev.target.value)}
                      className="rounded border px-1.5 py-1 text-[13px] outline-none"
                      style={{ borderColor: "#E7DEC8" }}
                    >
                      {TYPES_ABSENCE.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <input
                      type="date"
                      value={na.date}
                      onChange={(ev) => champNouvelleAbsence(e.id, "date", ev.target.value)}
                      className="rounded border px-1.5 py-1 text-[13px] outline-none"
                      style={{ borderColor: "#E7DEC8" }}
                    />
                    <input
                      value={na.motif}
                      onChange={(ev) => champNouvelleAbsence(e.id, "motif", ev.target.value)}
                      placeholder="Motif (optionnel)"
                      className="min-w-0 flex-1 rounded border px-1.5 py-1 text-[13px] outline-none"
                      style={{ borderColor: "#E7DEC8" }}
                    />
                    <Btn variant="gold" icon={Plus} small onClick={() => ajouterAbsence(e.id, `${e.prenom} ${e.nom}`)}>Ajouter</Btn>
                  </div>
                </div>
              );
            })}
            <p className="text-[13px]" style={{ color: "#9A8B67" }}>Choisis le type (Absence, Retard, Permissionnaire, Malade, Sans motif), la date, un motif si besoin, puis « Ajouter ». Ça apparaît aussitôt dans l'espace Parent.</p>
          </div>
        </Panel>
      )}

      {onglet === "notes" && (
        <Panel title="Notes & corrections" icon={ClipboardList}
               actions={<Btn variant="ghost" icon={RefreshCw} small onClick={actualiserPage}>Actualiser</Btn>}>
          {confirmation && (
            <div className="mb-4 flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-[15px]"
                 style={{ background: "#E4EEE3", color: "#2F5233" }}>
              <span className="flex items-center gap-2"><CheckCircle2 size={15} />{confirmation}</span>
              <button onClick={actualiserPage} className="flex items-center gap-1 text-[13px] font-medium underline underline-offset-2">
                <RefreshCw size={12} /> Actualiser la page
              </button>
            </div>
          )}
          <div key={cleActualisation} className="space-y-5">
            {matieres.length === 0 && (
              <p className="text-[15px]" style={{ color: "#9A8B67" }}>
                Aucune matière n'est encore configurée pour {maClasse}. Ajoute-les dans l'onglet « Matières » — elles apparaîtront alors ici automatiquement, prêtes à remplir pour chaque élève.
              </p>
            )}
            {mesEleves.map((e) => {
              const nn = nouvelleNote[e.id] || { evaluation: "Évaluation 2", mois: "Septembre" };
              const valeursSaisie = saisieRapide[e.id] || {};
              const nomEleve = `${e.prenom} ${e.nom}`;
              return (
                <div key={e.id} className="rounded-lg border p-4" style={{ borderColor: "#E7DEC8" }}>
                  <div className="mb-3 font-medium text-[15px]" style={{ color: "#1B2A4A" }}>{nomEleve}</div>

                  {/* Notes déjà saisies — modifiables et supprimables */}
                  {e.notes.length > 0 && (
                    <div className="mb-3 space-y-1.5">
                      {e.notes.map((n, i) => (
                        <div key={i} className="flex flex-wrap items-center gap-2 rounded-md border px-2.5 py-1.5 text-[13px]"
                             style={{ borderColor: "#E7DEC8" }}>
                          <span className="font-medium" style={{ color: "#1B2A4A" }}>{n.matiere}</span>
                          <span style={{ color: "#9A8B67" }}>{n.evaluation} · {n.mois}</span>
                          <input
                            type="number" min={0} max={20} defaultValue={n.note20}
                            className="ml-auto w-14 rounded border px-1 text-center outline-none"
                            style={{ borderColor: "#E7DEC8" }}
                            onBlur={(ev) => corrigerNote(e.id, i, ev.target.value, nomEleve)}
                          />
                          <span style={{ color: "#9A8B67" }}>/20</span>
                          <Trash2 size={13} className="cursor-pointer" style={{ color: "#8A2E2E" }}
                                  onClick={() => supprimerNote(e.id, i)} />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Toutes les matières de la classe, prêtes à remplir */}
                  {matieres.length > 0 && (
                    <div className="rounded-md p-2.5" style={{ background: "#F1ECDD" }}>
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <input
                          value={nn.evaluation}
                          onChange={(ev) => champNouvelleNote(e.id, "evaluation", ev.target.value)}
                          placeholder="Évaluation"
                          className="w-32 rounded border px-1.5 py-1 text-[13px] outline-none"
                          style={{ borderColor: "#E7DEC8" }}
                        />
                        <input
                          value={nn.mois}
                          onChange={(ev) => champNouvelleNote(e.id, "mois", ev.target.value)}
                          placeholder="Mois"
                          className="w-24 rounded border px-1.5 py-1 text-[13px] outline-none"
                          style={{ borderColor: "#E7DEC8" }}
                        />
                        <span className="text-[12px]" style={{ color: "#9A8B67" }}>— s'applique à toutes les matières remplies ci-dessous</span>
                      </div>
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {matieres.map((m) => (
                          <div key={m.nom} className="flex items-center justify-between gap-2 rounded border bg-white px-2.5 py-1.5"
                               style={{ borderColor: "#E7DEC8" }}>
                            <span className="text-[13px]" style={{ color: "#1B2A4A" }}>{m.nom}</span>
                            <input
                              type="number" min={0} max={20}
                              value={valeursSaisie[m.nom] || ""}
                              onChange={(ev) => champSaisieRapide(e.id, m.nom, ev.target.value)}
                              placeholder="/20"
                              className="w-16 rounded border px-1.5 py-1 text-center text-[13px] outline-none"
                              style={{ borderColor: "#E7DEC8" }}
                            />
                          </div>
                        ))}
                      </div>
                      <div className="mt-2 flex justify-end">
                        <Btn variant="gold" icon={Plus} small onClick={() => enregistrerNotesMatieres(e.id, nomEleve)}>Enregistrer ces notes</Btn>
                      </div>
                    </div>
                  )}

                  {/* Appréciation envoyée au parent, sur l'évolution de l'enfant */}
                  <div className="mt-3 rounded-md p-2.5" style={{ background: "#EFE9F5" }}>
                    <label className="mb-1 block text-[12px] font-medium" style={{ color: "#5C5240" }}>
                      Appréciation à envoyer au parent (évolution de l'enfant)
                    </label>
                    <div className="flex flex-wrap items-center gap-2">
                      <textarea
                        value={appreciationSaisie[e.id] || ""}
                        onChange={(ev) => setAppreciationSaisie((prev) => ({ ...prev, [e.id]: ev.target.value }))}
                        rows={2}
                        placeholder={`Ex. ${e.prenom} progresse bien en lecture ce mois-ci, encore un effort en dictée...`}
                        className="min-w-0 flex-1 rounded border px-2 py-1.5 text-[13px] outline-none"
                        style={{ borderColor: "#E7DEC8" }}
                      />
                      <Btn variant="primary" icon={Send} small onClick={() => envoyerAppreciation(e.id, nomEleve)}>Envoyer au parent</Btn>
                    </div>
                    {e.messages.length > 0 && (
                      <p className="mt-1.5 text-[12px]" style={{ color: "#9A8B67" }}>
                        Dernier message envoyé : « {e.messages[e.messages.length - 1].texte} » — {e.messages[e.messages.length - 1].date}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
            <p className="text-[13px]" style={{ color: "#9A8B67" }}>Modifie une note existante directement dans son champ, ou ajoute une nouvelle évaluation ci-dessous. Le bouton « Actualiser » en haut rafraîchit la page une fois la saisie terminée.</p>
          </div>
        </Panel>
      )}

      {onglet === "matieres" && (
        <Panel title={`Matières de la classe ${maClasse}`} icon={FileText}>
          <div className="mb-4 space-y-2">
            {matieres.map((m, i) => (
              <div key={i} className="flex flex-wrap items-center gap-2 rounded-lg border px-3 py-2"
                   style={{ borderColor: "#E7DEC8" }}>
                <input
                  defaultValue={m.nom}
                  onBlur={(ev) => modifierMatiere(i, "nom", ev.target.value)}
                  className="min-w-0 flex-1 rounded border px-2 py-1 text-[15px] outline-none"
                  style={{ borderColor: "#E7DEC8", color: "#1B2A4A" }}
                />
                <div className="flex items-center gap-1 text-[13px]" style={{ color: "#9A8B67" }}>
                  Coef.
                  <input
                    type="number" min={1} max={5} defaultValue={m.coef}
                    onBlur={(ev) => modifierMatiere(i, "coef", ev.target.value)}
                    className="w-12 rounded border px-1 py-1 text-center outline-none"
                    style={{ borderColor: "#E7DEC8" }}
                  />
                </div>
                <Trash2 size={15} className="cursor-pointer" style={{ color: "#8A2E2E" }}
                        onClick={() => supprimerMatiere(i)} />
              </div>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2 rounded-lg px-3 py-2" style={{ background: "#F1ECDD" }}>
            <input
              value={nouvelleMatiere.nom}
              onChange={(ev) => setNouvelleMatiere({ ...nouvelleMatiere, nom: ev.target.value })}
              placeholder="Nom de la nouvelle matière"
              className="min-w-0 flex-1 rounded border px-2 py-1.5 text-[15px] outline-none"
              style={{ borderColor: "#E7DEC8" }}
            />
            <div className="flex items-center gap-1 text-[13px]" style={{ color: "#5C5240" }}>
              Coef.
              <input
                type="number" min={1} max={5}
                value={nouvelleMatiere.coef}
                onChange={(ev) => setNouvelleMatiere({ ...nouvelleMatiere, coef: ev.target.value })}
                className="w-12 rounded border px-1 py-1.5 text-center outline-none"
                style={{ borderColor: "#E7DEC8" }}
              />
            </div>
            <Btn variant="gold" icon={Plus} small onClick={ajouterMatiere}>Ajouter la matière</Btn>
          </div>
        </Panel>
      )}
    </Coquille>
  );
}

/* ------------------------------------------------------------------
   ESPACE SECRÉTAIRE
------------------------------------------------------------------- */

const MODES_PAIEMENT = ["Espèces", "Orange Money", "MTN MoMo", "Wave", "Virement"];

function EspaceSecretaire({ eleves, setEleves, demandes, setDemandes, annonces, setAnnonces }) {
  const { classes, fraisTypes, setMessagesInternes } = useEcole();
  const [onglet, setOnglet] = useState("frais");
  const [confirmationInscription, setConfirmationInscription] = useState(null);
  const [nouvelleAnnonce, setNouvelleAnnonce] = useState("");

  // --- Inscription (enfant amené en personne au secrétariat) ---
  // La demande part vers la Bibliothèque du Directeur : la secrétaire ne
  // génère et ne voit jamais le code élève — seul le Directeur valide et le communique.
  const [form, setForm] = useState({ prenom: "", nom: "", sexe: "", naissance: "", classe: classes[0], parrainNom: "", parrainTelephone: "" });
  const champ = (cle) => (e) => setForm({ ...form, [cle]: e.target.value });
  const age = useMemo(() => ageDepuis(form.naissance), [form.naissance]);
  const valide = form.prenom.trim() && form.nom.trim() && form.sexe && form.naissance && form.parrainNom.trim() && form.parrainTelephone.trim();

  const soumettreInscription = () => {
    if (!valide) return;
    setDemandes((prev) => [
      {
        id: `DEM-${Math.floor(1000 + Math.random() * 9000)}`,
        prenom: form.prenom,
        nom: form.nom,
        sexe: form.sexe,
        naissance: form.naissance,
        age,
        classeSouhaitee: form.classe,
        parrainNom: form.parrainNom,
        parrainTelephone: form.parrainTelephone,
        message: "",
        origine: "secretariat",
        date: "aujourd'hui",
        statut: "en_attente",
      },
      ...prev,
    ]);
    setConfirmationInscription(`${form.prenom} ${form.nom}`);
    setForm({ prenom: "", nom: "", sexe: "", naissance: "", classe: classes[0], parrainNom: "", parrainTelephone: "" });
  };

  // --- Enregistrement d'un paiement : répartition sur plusieurs rubriques en une fois ---
  const [montantsSaisis, setMontantsSaisis] = useState({}); // { [eleveId]: { [libelle]: montant } }
  const [modePaiementSaisi, setModePaiementSaisi] = useState({}); // { [eleveId]: mode }
  const [confirmationPaiement, setConfirmationPaiement] = useState(null);

  const champMontant = (eleveId, libelle, valeur) => {
    setMontantsSaisis((prev) => ({
      ...prev,
      [eleveId]: { ...(prev[eleveId] || {}), [libelle]: valeur },
    }));
  };

  const totalSaisiPour = (eleveId) => {
    const montants = montantsSaisis[eleveId] || {};
    return Object.values(montants).reduce((s, v) => s + (parseFloat(v) || 0), 0);
  };

  const enregistrerPaiement = (eleve) => {
    const montants = montantsSaisis[eleve.id] || {};
    const mode = modePaiementSaisi[eleve.id] || MODES_PAIEMENT[0];
    const total = totalSaisiPour(eleve.id);
    if (total <= 0) return;
    setEleves((prev) => prev.map((e) => e.id === eleve.id ? { ...e, frais: e.frais.map((f) => { const ajout = parseFloat(montants[f.libelle]) || 0; if (ajout <= 0) return f; return { ...f, paye: f.paye + ajout, mode, datePaiement: "aujourd'hui" }; }) } : e));
    setMessagesInternes((prev) => [{ destinataire: "directeur", texte: "Paiement Secretaire: " + eleve.prenom + " " + eleve.nom + " (" + eleve.classe + ") Total " + total + "F (" + mode + ")", date: "aujourd'hui" }, ...prev]);
    setConfirmationPaiement(total.toLocaleString("fr-FR") + " F pour " + eleve.prenom + " " + eleve.nom + " - Visible Parent + Directeur");
    setMontantsSaisis((prev) => ({ ...prev, [eleve.id]: {} }));
  };

  const nav = [
    { id: "inscriptions", label: "Inscriptions", icon: ClipboardList },
    { id: "frais", label: "Frais scolaires", icon: Wallet },
    { id: "annonces", label: "Annonces", icon: Megaphone },
  ];

  return (
    <Coquille role="secretaire" roleLabel="Mlle Dossou · Secrétaire" nav={nav} actif={onglet} setActif={setOnglet}
              onQuitter={() => {}}>
      {onglet === "inscriptions" && (
        <>
          {confirmationInscription && (
            <div className="mb-4 flex items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-[15px]"
                 style={{ background: "#E4EEE3", color: "#2F5233" }}>
              <span className="flex items-center gap-2">
                <CheckCircle2 size={15} />
                Demande transmise au Directeur pour {confirmationInscription} — en attente de validation.
              </span>
              <button onClick={() => setConfirmationInscription(null)} className="text-[13px] underline underline-offset-2">Fermer</button>
            </div>
          )}

          <Panel title="Inscrire un enfant (venu en personne au secrétariat)" icon={FileText}>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Champ label="Prénom de l'enfant" value={form.prenom} onChange={champ("prenom")} />
              <Champ label="Nom de l'enfant" value={form.nom} onChange={champ("nom")} />
              <div>
                <label className="mb-1 block text-[13px] font-medium" style={{ color: "#5C5240" }}>Sexe</label>
                <div className="flex gap-2">
                  {[{ v: "F", l: "Féminin" }, { v: "M", l: "Masculin" }].map((opt) => (
                    <button key={opt.v} type="button" onClick={() => setForm({ ...form, sexe: opt.v })}
                            className="flex-1 rounded-lg border px-3 py-2 text-[15px] transition"
                            style={{
                              borderColor: form.sexe === opt.v ? "#C9A227" : "#E7DEC8",
                              background: form.sexe === opt.v ? "#FBF0D2" : "transparent",
                              color: form.sexe === opt.v ? "#8A6D14" : "#5C5240",
                            }}>
                      {opt.l}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="mb-1 block text-[13px] font-medium" style={{ color: "#5C5240" }}>Date de naissance</label>
                <div className="flex items-center gap-2">
                  <input type="date" value={form.naissance} onChange={champ("naissance")}
                         className="w-full rounded-lg border px-3 py-2 text-[15px] outline-none" style={{ borderColor: "#E7DEC8" }} />
                  {age !== null && <Badge tone="ardoise">{age} an{age > 1 ? "s" : ""}</Badge>}
                </div>
              </div>
              <div>
                <label className="mb-1 block text-[13px] font-medium" style={{ color: "#5C5240" }}>Classe souhaitée</label>
                <select value={form.classe} onChange={champ("classe")}
                        className="w-full rounded-lg border px-3 py-2 text-[15px] outline-none" style={{ borderColor: "#E7DEC8" }}>
                  {classes.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <Champ label="Nom du parrain" value={form.parrainNom} onChange={champ("parrainNom")} />
              <Champ label="Numéro du parrain" value={form.parrainTelephone} onChange={champ("parrainTelephone")} placeholder="9x xx xx xx" />
            </div>
            <div className="mt-4 flex items-center justify-between">
              {!valide && <p className="text-[13px]" style={{ color: "#8A2E2E" }}>Merci de remplir tous les champs.</p>}
              <div className="ml-auto"><Btn variant="gold" icon={Plus} onClick={soumettreInscription}>Transmettre au Directeur</Btn></div>
            </div>
            <p className="mt-3 text-[13px]" style={{ color: "#9A8B67" }}>
              Que l'inscription soit faite ici ou en ligne par le parent, elle part toujours dans la Bibliothèque du Directeur pour validation — la secrétaire ne génère pas et ne voit pas le code élève : seul le Directeur le valide et le communique à qui de droit.
            </p>
          </Panel>

          <div className="h-4" />

          <Panel title="Demandes en cours" icon={Inbox}>
            <div className="space-y-2">
              {demandes.length === 0 && <p className="text-[15px]" style={{ color: "#9A8B67" }}>Aucune demande pour le moment.</p>}
              {demandes.map((d) => (
                <div key={d.id} className="flex items-center justify-between rounded-lg border px-4 py-2.5 text-[15px]"
                     style={{ borderColor: "#E7DEC8" }}>
                  <div>
                    <span style={{ color: "#1B2A4A" }} className="font-medium">{d.prenom} {d.nom}</span>
                    <span className="ml-2 text-[13px]" style={{ color: "#9A8B67" }}>{d.classeSouhaitee} · {d.origine === "secretariat" ? "saisie au secrétariat" : "en ligne"}</span>
                  </div>
                  {d.statut === "en_attente" && <Badge tone="or">En attente</Badge>}
                  {d.statut === "validee" && <Badge tone="vert">Validée</Badge>}
                  {d.statut === "refusee" && <Badge tone="ardoise">Refusée</Badge>}
                </div>
              ))}
            </div>
          </Panel>

          <div className="h-4" />

          <Panel title="Élèves inscrits" icon={ClipboardList}>
            <div className="space-y-2">
              {eleves.map((e) => (
                <div key={e.id} className="flex items-center justify-between rounded-lg border px-4 py-2.5 text-[15px]"
                     style={{ borderColor: "#E7DEC8" }}>
                  <span style={{ color: "#1B2A4A" }} className="font-medium">{e.prenom} {e.nom}</span>
                  <Badge tone="ardoise">{e.classe}</Badge>
                </div>
              ))}
            </div>
          </Panel>
        </>
      )}

      {onglet === "frais" && (
        <Panel title="Frais scolaires" icon={Wallet}>
          {confirmationPaiement && (
            <div className="mb-4 flex items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-[15px]"
                 style={{ background: "#E4EEE3", color: "#2F5233" }}>
              <span className="flex items-center gap-2"><CheckCircle2 size={15} />{confirmationPaiement}</span>
              <button onClick={() => setConfirmationPaiement(null)} className="text-[13px] underline underline-offset-2">Fermer</button>
            </div>
          )}
          <div className="space-y-4">
            {eleves.map((e) => {
              const du = e.frais.reduce((a, f) => a + f.du, 0);
              const paye = e.frais.reduce((a, f) => a + f.paye, 0);
              const reste = du - paye;
              const mode = modePaiementSaisi[e.id] || MODES_PAIEMENT[0];
              const totalSaisi = totalSaisiPour(e.id);
              return (
                <div key={e.id} className="rounded-lg border p-4" style={{ borderColor: "#E7DEC8" }}>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="font-medium text-[15px]" style={{ color: "#1B2A4A" }}>{e.prenom} {e.nom}</span>
                    <Badge tone={reste === 0 ? "vert" : "or"}>{reste === 0 ? "Soldé" : `Reste ${reste.toLocaleString("fr-FR")} F`}</Badge>
                  </div>
                  <div className="space-y-2">
                    {e.frais.map((f, i) => {
                      const soldee = f.paye >= f.du;
                      const valeurSaisie = (montantsSaisis[e.id] || {})[f.libelle] || "";
                      return (
                        <div key={i} className="flex flex-wrap items-center justify-between gap-2 rounded border px-2.5 py-2 text-[13px]" style={{ borderColor: "#E7DEC8" }}>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium" style={{ color: "#1B2A4A" }}>{f.libelle}</span>
                              <Badge tone={soldee ? "vert" : f.paye > 0 ? "or" : "ardoise"}>
                                {soldee ? "Soldé" : f.paye > 0 ? "Partiel" : "Impayé"}
                              </Badge>
                            </div>
                            <div style={{ color: "#5C5240" }} className="mt-0.5">
                              Dû : {f.du.toLocaleString("fr-FR")} F · Payé : {f.paye.toLocaleString("fr-FR")} F
                              {f.mode && ` · Dernier paiement : ${f.mode} (${f.datePaiement})`}
                            </div>
                          </div>
                          <input
                            type="number" min={0}
                            value={valeurSaisie}
                            onChange={(ev) => champMontant(e.id, f.libelle, ev.target.value)}
                            placeholder={soldee ? "Complément éventuel" : "Montant à verser"}
                            className="w-32 rounded border px-2 py-1 text-right outline-none"
                            style={{ borderColor: "#E7DEC8" }}
                          />
                        </div>
                      );
                    })}
                  </div>
                  {(reste > 0 || totalSaisi > 0) && (
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg px-3 py-2" style={{ background: "#F1ECDD" }}>
                      <div className="flex items-center gap-2 text-[13px]" style={{ color: "#5C5240" }}>
                        Total saisi maintenant :
                        <span className="font-serif text-base" style={{ color: totalSaisi > 0 ? "#2F5233" : "#9A8B67" }}>
                          {totalSaisi.toLocaleString("fr-FR")} F
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <select
                          value={mode}
                          onChange={(ev) => setModePaiementSaisi((prev) => ({ ...prev, [e.id]: ev.target.value }))}
                          className="rounded border px-2 py-1.5 text-[13px] outline-none"
                          style={{ borderColor: "#E7DEC8" }}
                        >
                          {MODES_PAIEMENT.map((m) => <option key={m} value={m}>{m}</option>)}
                        </select>
                        <Btn variant="gold" small onClick={() => enregistrerPaiement(e)}>Enregistrer ce paiement</Btn>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <p className="mt-3 text-[13px]" style={{ color: "#9A8B67" }}>
            Renseigne un montant sur chaque rubrique concernée (ex. 3 000 F sur T-shirt et 17 000 F sur Écolage pour une remise de 20 000 F) — le total saisi s'actualise en direct pour vérifier avant de valider.
          </p>
        </Panel>
      )}

      {(onglet === "annonces" || onglet === "messagePublic") && (
        <Panel title="Publier une annonce" icon={Megaphone}>
          <div className="mb-4 flex gap-2">
            <input
              value={nouvelleAnnonce}
              onChange={(e) => setNouvelleAnnonce(e.target.value)}
              placeholder="Ex. La cantine sera fermée demain"
              className="w-full rounded-lg border px-3 py-2 text-[15px] outline-none"
              style={{ borderColor: "#E7DEC8" }}
            />
            <Btn variant="primary" icon={Plus} onClick={() => {
              if (!nouvelleAnnonce.trim()) return;
              setAnnonces([{ titre: nouvelleAnnonce, texte: nouvelleAnnonce, date: "aujourd'hui" }, ...annonces]);
              setNouvelleAnnonce("");
            }}>Publier</Btn>
          </div>
          <div className="space-y-2">
            {annonces.map((a, i) => (
              <div key={i} className="rounded-lg border px-4 py-2.5" style={{ borderColor: "#E7DEC8" }}>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-[15px]" style={{ color: "#1B2A4A" }}>{a.titre}</span>
                  <span className="text-[13px]" style={{ color: "#9A8B67" }}>{a.date}</span>
                </div>
                <p className="mt-1 text-[15px]" style={{ color: "#5C5240" }}>{a.texte}</p>
              </div>
            ))}
          </div>
          <p className="mt-2 text-[13px]" style={{ color: "#9A8B67" }}>Ces annonces sont partagées avec celles du Directeur — tous les parents les voient au même endroit.</p>
        </Panel>
      )}
    </Coquille>
  );
}

/* ------------------------------------------------------------------
   ESPACE PARENT
------------------------------------------------------------------- */

function EspaceParent({ eleves, setEleves, eleveId, personnel }) {
  const { setMessagesParents, setMessagesInternes, annonces, anneesArchivees } = useEcole();
  const [onglet, setOnglet] = useState("notes");
  const [message, setMessage] = useState("");
  const enfant = eleves.find((e) => e.id === eleveId) || eleves[0];

  const enseignantClasse = useMemo(
    () => personnel.find((p) => p.classe === enfant.classe && (p.poste === "Enseignant" || p.poste === "Enseignante")),
    [personnel, enfant.classe]
  );

  const nav = [
    { id: "notes", label: "Notes (Lecture seule)", icon: ClipboardList },
    { id: "absences", label: "Absences (Lecture seule)", icon: CalendarClock },
    { id: "frais", label: "Frais (Lecture seule)", icon: Wallet },
    { id: "annonces", label: "Annonces Ecole (Lecture seule)", icon: Megaphone },
    { id: "archives", label: "Archives Annees", icon: CalendarClock },
    { id: "messages", label: "Envoyer Message au Directeur", icon: MessageSquare },
  ];

  const moyenne = useMemo(() => {
    if (!enfant.notes.length) return null;
    const total = enfant.notes.reduce((s, n) => s + n.note20, 0);
    return Math.round((total / enfant.notes.length) * 10) / 10;
  }, [enfant]);

  return (
    <Coquille role="parent" roleLabel={`Parent de ${enfant.prenom} ${enfant.nom}`} nav={nav} actif={onglet} setActif={setOnglet}
              onQuitter={() => {}}>
      <Panel title="Profil de l'élève" icon={UserCircle2}>
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full text-lg font-serif"
               style={{ background: "#1B2A4A", color: "#C9A227" }}>
            {enfant.prenom[0]}{enfant.nom[0]}
          </div>
          <div className="grid flex-1 grid-cols-2 gap-2 text-[15px] sm:grid-cols-4">
            <div><div className="text-[13px]" style={{ color: "#9A8B67" }}>Classe</div><div style={{ color: "#1B2A4A" }} className="font-medium">{enfant.classe}</div></div>
            <div><div className="text-[13px]" style={{ color: "#9A8B67" }}>Code élève</div><div className="font-mono text-[13px]" style={{ color: "#1B2A4A" }}>{enfant.id}</div></div>
            <div><div className="text-[13px]" style={{ color: "#9A8B67" }}>Naissance</div><div style={{ color: "#1B2A4A" }}>{enfant.naissance}</div></div>
            <div>
              <div className="text-[13px]" style={{ color: "#9A8B67" }}>Enseignant(e)</div>
              <div style={{ color: "#1B2A4A" }}>{enseignantClasse?.nom || enfant.enseignant}</div>
              {enseignantClasse?.telephone && <div className="text-[13px]" style={{ color: "#5C5240" }}>{enseignantClasse.telephone}</div>}
            </div>
          </div>
        </div>
      </Panel>

      {onglet === "notes" && (
        <>
          {enfant.notes.length > 0 && (
            <div className="mb-4 grid grid-cols-2 gap-4 rounded-2xl p-5" style={{ background: "#1B2A4A" }}>
              <div>
                <div className="text-[12px] uppercase tracking-wider" style={{ color: "#9FB0CC" }}>Total des points</div>
                <div className="font-serif text-2xl" style={{ color: "#FAF6EE" }}>
                  {enfant.notes.reduce((s, n) => s + n.note20, 0)} / {enfant.notes.length * 20}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[12px] uppercase tracking-wider" style={{ color: "#9FB0CC" }}>Moyenne</div>
                <div className="font-serif text-2xl" style={{ color: "#C9A227" }}>{moyenne}/20</div>
                <div className="text-[13px]" style={{ color: "#C9A227" }}>{mentionPour(moyenne)}</div>
              </div>
            </div>
          )}
          <Panel title="Historique des notes" icon={ClipboardList}>
            <div className="space-y-3">
              {enfant.notes.length === 0 && <p className="text-[15px]" style={{ color: "#9A8B67" }}>Aucune note enregistrée pour l'instant.</p>}
              {enfant.notes.map((n, i) => (
                <div key={i} className="flex items-center justify-between gap-3 rounded-xl border px-4 py-3"
                     style={{ borderColor: "#E7DEC8" }}>
                  <div className="min-w-0">
                    <div className="font-serif text-[16px]" style={{ color: "#1B2A4A" }}>{n.matiere}</div>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      <Badge tone="or">{n.evaluation}</Badge>
                      <Badge tone="vert">{n.mois}</Badge>
                    </div>
                    <div className="mt-1.5 text-[13px]" style={{ color: "#5C5240" }}>{mentionPour(n.note20)}</div>
                    {n.dateSaisie && <div className="mt-0.5 text-[12px]" style={{ color: "#9A8B67" }}>Saisi le {n.dateSaisie}</div>}
                  </div>
                  <div className="flex h-14 w-16 shrink-0 items-center justify-center rounded-full font-serif text-base"
                       style={{ background: "#F6D24A", color: "#5C4A00" }}>
                    {n.note20}/20
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </>
      )}

      {onglet === "absences" && (
        <Panel title="Absences et retards" icon={CalendarClock}>
          <div className="space-y-2">
            {enfant.absences.length === 0 && <p className="text-[15px]" style={{ color: "#9A8B67" }}>Aucune absence enregistrée.</p>}
            {enfant.absences.map((a, i) => (
              <div key={i} className="rounded-lg border px-4 py-2.5 text-[15px]" style={{ borderColor: "#E7DEC8" }}>
                <div className="flex items-center justify-between">
                  <Badge tone={a.type === "Sans motif" ? "or" : "vert"}>{a.type}</Badge>
                  <span className="text-[13px]" style={{ color: "#9A8B67" }}>{a.date}</span>
                </div>
                <p className="mt-1" style={{ color: "#5C5240" }}>{a.motif}</p>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {onglet === "frais" && (
        <Panel title="Situation financière" icon={Wallet}>
          <div className="space-y-2">
            {enfant.frais.map((f, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg border px-4 py-2.5 text-[15px]"
                   style={{ borderColor: "#E7DEC8" }}>
                <span className="font-medium" style={{ color: "#1B2A4A" }}>{f.libelle}</span>
                <div className="flex items-center gap-3">
                  <span style={{ color: "#5C5240" }}>{f.paye.toLocaleString("fr-FR")} / {f.du.toLocaleString("fr-FR")} F</span>
                  <Badge tone={f.paye >= f.du ? "vert" : "or"}>{f.paye >= f.du ? "Soldé" : "Reste"}</Badge>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {(onglet === "messages" || onglet === "messageInterne") && (
        <Panel title="Messages avec l'administration" icon={MessageSquare}>
          <div className="mb-3 space-y-2">
            {enfant.messages.map((m, i) => (
              <div key={i} className="rounded-lg px-3 py-2 text-[15px]" style={{ background: "#F1ECDD" }}>
                <div className="flex items-center justify-between text-[13px]" style={{ color: "#9A8B67" }}>
                  <span className="font-medium" style={{ color: "#1B2A4A" }}>{m.auteur}</span>{m.date}
                </div>
                <p style={{ color: "#3E3625" }}>{m.texte}</p>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Écrire un message à l'administration..."
              className="w-full rounded-lg border px-3 py-2 text-[15px] outline-none"
              style={{ borderColor: "#E7DEC8" }}
            />
            <Btn variant="primary" icon={Send} onClick={() => {
              if (!message.trim()) return;
              setEleves((prev) => prev.map((e) => e.id === enfant.id
                ? { ...e, messages: [...e.messages, { auteur: "Vous", texte: message, date: "aujourd'hui" }] }
                : e));
              setMessagesParents((prev) => [
                { eleveId: enfant.id, nomEleve: `${enfant.prenom} ${enfant.nom}`, classe: enfant.classe, texte: message, date: "aujourd'hui", lu: false },
                ...prev,
              ]);
              setMessage("");
            }}>Envoyer</Btn>
          </div>
        </Panel>
      )}
    </Coquille>
  );
}

/* ------------------------------------------------------------------
   APPLICATION
------------------------------------------------------------------- */

/* ------------------------------------------------------------------
   SYNCHRONISATION SUPABASE
   Au chargement : on lit toutes les tables et on reconstruit les
   formes utilisées par l'application. Ensuite, à chaque changement
   d'un état (eleves, classes, personnel...), on répercute automat-
   iquement la modification vers Supabase — aucun autre composant
   n'a besoin d'être modifié pour ça.
------------------------------------------------------------------- */

const ID_MIN_UUID = "00000000-0000-0000-0000-000000000000";

async function chargerToutesLesDonnees() {
  const [
    ecoleRows, codesRows, classesRows, matieresRows, personnelRows, elevesRows,
    notesRows, absencesRows, fraisTypesRows, fraisEleveRows, annoncesRows,
    messagesEleveRows, messagesParentsRows, messagesInternesRows, demandesRows, anneesRows,
  ] = await Promise.all([
    pgSelect("ecole", "&id=eq.1"),
    pgSelect("codes_acces"),
    pgSelect("classes", "&order=ordre"),
    pgSelect("matieres"),
    pgSelect("personnel"),
    pgSelect("eleves"),
    pgSelect("notes"),
    pgSelect("absences"),
    pgSelect("frais_types"),
    pgSelect("frais_eleve"),
    pgSelect("annonces", "&order=cree_le.desc"),
    pgSelect("messages_eleve"),
    pgSelect("messages_parents", "&order=cree_le.desc"),
    pgSelect("messages_internes", "&order=cree_le.desc"),
    pgSelect("demandes_inscription"),
    pgSelect("annees_archivees"),
  ]);

  const ecoleRow = (ecoleRows || [])[0];
  const ecole = ecoleRow ? {
    nom: ecoleRow.nom, sigle: ecoleRow.sigle, quartier: ecoleRow.quartier,
    commune: ecoleRow.commune, departement: ecoleRow.departement, directeur: ecoleRow.directeur,
    telephone: ecoleRow.telephone, telephoneDirecteur: ecoleRow.telephone_directeur,
    email: ecoleRow.email, devise: ecoleRow.devise, logoUrl: ecoleRow.logo_url,
  } : ECOLE_INIT;
  const anneeScolaire = ecoleRow?.annee_scolaire || ANNEE_INIT;

  const codes = { directeur: "1234", enseignant: "5678", secretaire: "9012" };
  (codesRows || []).forEach((c) => { codes[c.role] = c.code; });

  const classes = (classesRows || []).map((c) => c.nom);
  if (classes.length === 0) classes.push(...CLASSES_INIT);

  const matieresParClasse = {};
  (matieresRows || []).forEach((m) => {
    if (!matieresParClasse[m.classe]) matieresParClasse[m.classe] = [];
    matieresParClasse[m.classe].push({ nom: m.nom, coef: m.coefficient });
  });

  const personnel = (personnelRows || []).map((p) => ({
    nom: p.nom, poste: p.poste, classe: p.classe, telephone: p.telephone,
  }));

  const fraisTypes = (fraisTypesRows || []).map((f) => ({ libelle: f.libelle, montant: Number(f.montant) }));

  const eleves = (elevesRows || []).map((e) => ({
    id: e.id, prenom: e.prenom, nom: e.nom, sexe: e.sexe, naissance: e.naissance,
    classe: e.classe, enseignant: e.enseignant,
    parent: { nom: e.parrain_nom, telephone: e.parrain_telephone },
    notes: (notesRows || []).filter((n) => n.eleve_id === e.id).map((n) => ({
      matiere: n.matiere, evaluation: n.evaluation, mois: n.mois, note20: Number(n.note20), dateSaisie: n.date_saisie,
    })),
    absences: (absencesRows || []).filter((a) => a.eleve_id === e.id).map((a) => ({
      date: a.date, type: a.type, motif: a.motif,
    })),
    frais: (fraisEleveRows || []).filter((f) => f.eleve_id === e.id).map((f) => ({
      libelle: f.libelle, du: Number(f.du), paye: Number(f.paye), mode: f.mode, datePaiement: f.date_paiement,
    })),
    messages: (messagesEleveRows || []).filter((m) => m.eleve_id === e.id).map((m) => ({
      auteur: m.auteur, texte: m.texte, date: m.date,
    })),
  }));

  const annonces = (annoncesRows || []).map((a) => ({ titre: a.titre, texte: a.texte, date: a.date }));

  const messagesInternes = (messagesInternesRows || []).map((m) => ({
    destinataire: m.destinataire, texte: m.texte, date: m.date,
  }));

  const messagesParents = (messagesParentsRows || []).map((m) => ({
    eleveId: m.eleve_id, nomEleve: m.nom_eleve, classe: m.classe, texte: m.texte, date: m.date, lu: m.lu,
  }));

  const demandes = (demandesRows || []).map((d) => ({
    id: d.id, prenom: d.prenom, nom: d.nom, sexe: d.sexe, naissance: d.naissance, age: d.age,
    classeSouhaitee: d.classe_souhaitee, parrainNom: d.parrain_nom, parrainTelephone: d.parrain_telephone,
    message: d.message, origine: d.origine, date: d.date, statut: d.statut,
  }));

  const anneesArchivees = (anneesRows || []).map((a) => ({
    annee: a.annee, dateArchivage: a.date_archivage, eleves: a.donnees,
  }));

  return {
    ecole, anneeScolaire, codes, classes, matieresParClasse, personnel, fraisTypes,
    eleves, annonces, messagesInternes, messagesParents, demandes, anneesArchivees,
  };
}

async function syncEcole(ecole, anneeScolaire) {
  if (!ecole) return;
  await pgUpsert("ecole", [{
    id: 1, nom: ecole.nom, sigle: ecole.sigle, quartier: ecole.quartier, commune: ecole.commune,
    departement: ecole.departement, directeur: ecole.directeur, telephone: ecole.telephone,
    telephone_directeur: ecole.telephoneDirecteur, email: ecole.email, devise: ecole.devise,
    logo_url: ecole.logoUrl, annee_scolaire: anneeScolaire,
  }], "id");
}

async function syncCodes(codes) {
  const lignes = Object.entries(codes || {}).map(([role, code]) => ({ role, code }));
  await pgUpsert("codes_acces", lignes, "role");
}

async function syncClasses(classes) {
  const noms = classes || [];
  await pgUpsert("classes", noms.map((nom, i) => ({ nom, ordre: i })), "nom");
  const existantes = (await pgSelect("classes")) || [];
  const aSupprimer = existantes.map((r) => r.nom).filter((n) => !noms.includes(n));
  await pgDeleteIn("classes", "nom", aSupprimer);
}

async function syncMatieresParClasse(matieresParClasse) {
  const lignes = Object.entries(matieresParClasse || {}).flatMap(([classe, liste]) =>
    (liste || []).map((m) => ({ classe, nom: m.nom, coefficient: m.coef }))
  );
  await pgDeleteToutes("matieres", "id");
  await pgInsert("matieres", lignes);
}

async function syncPersonnel(personnel) {
  await pgDeleteToutes("personnel", "id");
  await pgInsert("personnel", (personnel || []).map((p) => ({
    nom: p.nom ?? null, poste: p.poste ?? null, classe: p.classe ?? null, telephone: p.telephone ?? null,
  })));
}

async function syncFraisTypes(fraisTypes) {
  await pgDeleteToutes("frais_types", "id");
  await pgInsert("frais_types", (fraisTypes || []).map((f) => ({ libelle: f.libelle ?? null, montant: f.montant ?? 0 })));
}

async function syncAnnonces(annonces) {
  await pgDeleteToutes("annonces", "id");
  await pgInsert("annonces", [...(annonces || [])].reverse().map((a) => ({
    titre: a.titre ?? null, texte: a.texte ?? null, date: a.date ?? null,
  })));
}

async function syncMessagesInternes(messagesInternes) {
  await pgDeleteToutes("messages_internes", "id");
  await pgInsert("messages_internes", [...(messagesInternes || [])].reverse().map((m) => ({
    destinataire: m.destinataire ?? null, texte: m.texte ?? null, date: m.date ?? null,
  })));
}

async function syncMessagesParents(messagesParents) {
  await pgDeleteToutes("messages_parents", "id");
  await pgInsert("messages_parents", [...(messagesParents || [])].reverse().map((m) => ({
    eleve_id: m.eleveId ?? null, nom_eleve: m.nomEleve ?? null, classe: m.classe ?? null,
    texte: m.texte ?? null, date: m.date ?? null, lu: m.lu ?? false,
  })));
}

async function syncDemandes(demandes) {
  const lignes = (demandes || []).map((d) => ({
    id: d.id, prenom: d.prenom, nom: d.nom, sexe: d.sexe ?? null, naissance: d.naissance ?? null,
    age: d.age ?? null, classe_souhaitee: d.classeSouhaitee ?? null, parrain_nom: d.parrainNom ?? null,
    parrain_telephone: d.parrainTelephone ?? null, message: d.message ?? null, origine: d.origine ?? null,
    date: d.date ?? null, statut: d.statut ?? null,
  }));
  await pgUpsert("demandes_inscription", lignes, "id");
  const existantes = (await pgSelect("demandes_inscription")) || [];
  const idsActuels = (demandes || []).map((d) => d.id);
  const aSupprimer = existantes.map((r) => r.id).filter((id) => !idsActuels.includes(id));
  await pgDeleteIn("demandes_inscription", "id", aSupprimer);
}

async function syncAnneesArchivees(anneesArchivees) {
  await pgDeleteToutes("annees_archivees", "id");
  await pgInsert("annees_archivees", (anneesArchivees || []).map((a) => ({
    annee: a.annee, date_archivage: a.dateArchivage, donnees: a.eleves,
  })));
}

async function syncEleves(eleves) {
  const liste = eleves || [];
  const ids = liste.map((e) => e.id);

  await pgUpsert("eleves", liste.map((e) => ({
    id: e.id, prenom: e.prenom, nom: e.nom, sexe: e.sexe ?? null, naissance: e.naissance ?? null,
    classe: e.classe ?? null, enseignant: e.enseignant ?? null,
    parrain_nom: e.parent?.nom ?? null, parrain_telephone: e.parent?.telephone ?? null,
  })), "id");

  const existants = (await pgSelect("eleves")) || [];
  const aSupprimer = existants.map((r) => r.id).filter((id) => !ids.includes(id));
  await pgDeleteIn("eleves", "id", aSupprimer);

  const filtreIds = ids.length ? ids : ["__aucun__"];
  await pgDeleteIn("notes", "eleve_id", filtreIds);
  await pgDeleteIn("absences", "eleve_id", filtreIds);
  await pgDeleteIn("frais_eleve", "eleve_id", filtreIds);
  await pgDeleteIn("messages_eleve", "eleve_id", filtreIds);

  await pgInsert("notes", liste.flatMap((e) => (e.notes || []).map((n) => ({
    eleve_id: e.id, matiere: n.matiere ?? null, evaluation: n.evaluation ?? null,
    mois: n.mois ?? null, note20: n.note20 ?? null, date_saisie: n.dateSaisie ?? null,
  }))));

  await pgInsert("absences", liste.flatMap((e) => (e.absences || []).map((a) => ({
    eleve_id: e.id, date: a.date ?? null, type: a.type ?? null, motif: a.motif ?? null,
  }))));

  await pgInsert("frais_eleve", liste.flatMap((e) => (e.frais || []).map((f) => ({
    eleve_id: e.id, libelle: f.libelle ?? null, du: f.du ?? 0, paye: f.paye ?? 0,
    mode: f.mode ?? null, date_paiement: f.datePaiement ?? null,
  }))));

  await pgInsert("messages_eleve", liste.flatMap((e) => (e.messages || []).map((m) => ({
    eleve_id: e.id, auteur: m.auteur ?? null, texte: m.texte ?? null, date: m.date ?? null,
  }))));
}


export default function EcoleConnecteeCSP() {
  const [role, setRole] = useState(null);
  const [eleveIdActif, setEleveIdActif] = useState(null); // enfant identifié par code, pour l'espace parent
  const [vue, setVue] = useState("connexion"); // connexion | inscription
  const [eleves, setEleves] = useState(ELEVES_INIT);
  const [personnel, setPersonnel] = useState(PERSONNEL_INIT);
  const [annonces, setAnnonces] = useState(ANNONCES_INIT);
  const [demandes, setDemandes] = useState(DEMANDES_INIT);
  const [ecole, setEcole] = useState(ECOLE_INIT);
  const [classes, setClasses] = useState(CLASSES_INIT);
  const [codes, setCodes] = useState(CODES_INIT);
  const [anneeScolaire, setAnneeScolaire] = useState(ANNEE_INIT);
  const [fraisTypes, setFraisTypes] = useState(FRAIS_TYPES_INIT);
  const [matieresParClasse, setMatieresParClasse] = useState(MATIERES_PAR_CLASSE_INIT);
  const [messagesInternes, setMessagesInternes] = useState([]);
  const [anneesArchivees, setAnneesArchivees] = useState([]);
  const [messagesParents, setMessagesParents] = useState([]);

  // --- Chargement initial depuis Supabase ---
  const [chargement, setChargement] = useState(true);
  const [erreurChargement, setErreurChargement] = useState(null);
  const pretPourSync = useRef(false);

  useEffect(() => {
    let annule = false;
    chargerToutesLesDonnees()
      .then((d) => {
        if (annule) return;
        setEcole(d.ecole);
        setAnneeScolaire(d.anneeScolaire);
        setCodes(d.codes);
        setClasses(d.classes);
        setMatieresParClasse(d.matieresParClasse);
        setPersonnel(d.personnel.length ? d.personnel : PERSONNEL_INIT);
        setFraisTypes(d.fraisTypes.length ? d.fraisTypes : FRAIS_TYPES_INIT);
        setEleves(d.eleves);
        setAnnonces(d.annonces);
        setMessagesInternes(d.messagesInternes);
        setMessagesParents(d.messagesParents);
        setDemandes(d.demandes);
        setAnneesArchivees(d.anneesArchivees);
      })
      .catch((err) => { if (!annule) setErreurChargement(err.message); })
      .finally(() => {
        if (annule) return;
        setChargement(false);
        // on n'active la synchronisation qu'après ce premier chargement,
        // pour ne pas écraser Supabase avec les valeurs de démarrage
        setTimeout(() => { pretPourSync.current = true; }, 0);
      });
    return () => { annule = true; };
  }, []);

  // --- Synchronisation automatique : dès qu'un état change ici, on répercute vers Supabase ---
  const [erreurSync, setErreurSync] = useState(null);
  const avecSuivi = (promesse) => promesse.catch((err) => setErreurSync(err.message || String(err)));

  useEffect(() => { if (pretPourSync.current) avecSuivi(syncEcole(ecole, anneeScolaire)); }, [ecole, anneeScolaire]);
  useEffect(() => { if (pretPourSync.current) avecSuivi(syncCodes(codes)); }, [codes]);
  useEffect(() => { if (pretPourSync.current) avecSuivi(syncClasses(classes)); }, [classes]);
  useEffect(() => { if (pretPourSync.current) avecSuivi(syncMatieresParClasse(matieresParClasse)); }, [matieresParClasse]);
  useEffect(() => { if (pretPourSync.current) avecSuivi(syncPersonnel(personnel)); }, [personnel]);
  useEffect(() => { if (pretPourSync.current) avecSuivi(syncFraisTypes(fraisTypes)); }, [fraisTypes]);
  useEffect(() => { if (pretPourSync.current) avecSuivi(syncEleves(eleves)); }, [eleves]);
  useEffect(() => { if (pretPourSync.current) avecSuivi(syncAnnonces(annonces)); }, [annonces]);
  useEffect(() => { if (pretPourSync.current) avecSuivi(syncMessagesInternes(messagesInternes)); }, [messagesInternes]);
  useEffect(() => { if (pretPourSync.current) avecSuivi(syncMessagesParents(messagesParents)); }, [messagesParents]);
  useEffect(() => { if (pretPourSync.current) avecSuivi(syncDemandes(demandes)); }, [demandes]);
  useEffect(() => { if (pretPourSync.current) avecSuivi(syncAnneesArchivees(anneesArchivees)); }, [anneesArchivees]);

  if (chargement) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center" style={{ background: "#FAF6EE" }}>
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-t-transparent" style={{ borderColor: "#1B2A4A", borderTopColor: "transparent" }} />
          <p className="font-serif text-lg" style={{ color: "#1B2A4A" }}>Connexion à la base de données...</p>
          {erreurChargement && (
            <p className="mt-2 max-w-sm text-[13px]" style={{ color: "#8A2E2E" }}>
              Erreur : {erreurChargement} — vérifie que le script SQL a bien été exécuté dans Supabase.
            </p>
          )}
        </div>
      </div>
    );
  }

  const contexteEcole = {
    ecole, setEcole, classes, setClasses,
    codes, setCodes, anneeScolaire, setAnneeScolaire,
    fraisTypes, setFraisTypes, matieresParClasse, setMatieresParClasse,
    messagesInternes, setMessagesInternes, anneesArchivees, setAnneesArchivees,
    messagesParents, setMessagesParents,
  };

  const entrer = (roleChoisi, extra) => {
    setRole(roleChoisi);
    if (roleChoisi === "parent") setEleveIdActif(extra);
  };

  if (vue === "inscription") {
    return (
      <EcoleContext.Provider value={contexteEcole}>
        <InscriptionEnLigne
          onRetour={() => setVue("connexion")}
          onSoumettre={(demande) => setDemandes((prev) => [demande, ...prev])}
        />
      </EcoleContext.Provider>
    );
  }

  if (!role) {
    return (
      <EcoleContext.Provider value={contexteEcole}>
        <Connexion onEntrer={entrer} onInscription={() => setVue("inscription")} eleves={eleves} />
      </EcoleContext.Provider>
    );
  }

  const sortir = () => { setRole(null); setEleveIdActif(null); };

  const Ecran = {
    directeur: (
      <EspaceDirecteur
        eleves={eleves}
        personnel={personnel}
        setPersonnel={setPersonnel}
        annonces={annonces}
        setAnnonces={setAnnonces}
        demandes={demandes}
        setDemandes={setDemandes}
        setEleves={setEleves}
      />
    ),
    enseignant: <EspaceEnseignant eleves={eleves} setEleves={setEleves} />,
    secretaire: (
      <EspaceSecretaire
        eleves={eleves}
        setEleves={setEleves}
        demandes={demandes}
        setDemandes={setDemandes}
        annonces={annonces}
        setAnnonces={setAnnonces}
      />
    ),
    parent: <EspaceParent eleves={eleves} setEleves={setEleves} eleveId={eleveIdActif} personnel={personnel} />,
  }[role];

  return (
    <EcoleContext.Provider value={contexteEcole}>
      <div>
        {erreurSync && (
          <div className="fixed left-0 right-0 top-0 z-30 flex items-center justify-between gap-2 px-4 py-2 text-[13px]"
               style={{ background: "#8A2E2E", color: "#FFFFFF" }}>
            <span>⚠ Échec de sauvegarde vers la base de données : {erreurSync}</span>
            <button onClick={() => setErreurSync(null)} className="shrink-0 underline">Fermer</button>
          </div>
        )}
        <div className="fixed bottom-4 right-4 z-20">
          <button onClick={sortir}
                  className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] shadow-md"
                  style={{ background: "#1B2A4A", color: "#FAF6EE" }}>
            <LogOut size={12} /> Changer de rôle
          </button>
        </div>
        {Ecran}
      </div>
    </EcoleContext.Provider>
  );
}
