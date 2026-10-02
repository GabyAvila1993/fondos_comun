const fs = require('fs');
const path = require('path');

function walk(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        const p = path.join(dir, f);
        if (fs.statSync(p).isDirectory()) walk(p, callback);
        else if (p.endsWith('.tsx') || p.endsWith('.ts')) callback(p);
    });
}

function replaceInFile(file, replacements) {
    let content = fs.readFileSync(file, 'utf8');
    let changed = false;
    for (const [search, replace] of replacements) {
        if (content.includes(search)) {
            content = content.split(search).join(replace);
            changed = true;
        }
    }
    if (changed) {
        fs.writeFileSync(file, content, 'utf8');
        console.log('Updated ' + file);
    }
}

walk('src', file => {
    let replacements = [];
    
    // Add forward slash conversions for Windows paths to ease matching
    const p = file.replace(/\\\\/g, '/');

    if (p.includes('App.tsx')) {
        replacements.push([
            'import LoginScreen from "./components/LoginScreen";',
            'import LoginScreen from "./autenticacion/LoginScreen";'
        ]);
        replacements.push([
            'import UserDashboard from "./components/UserDashboard";',
            'import UserDashboard from "./UserDashboard";'
        ]);
        replacements.push([
            'import { SocketProvider } from "./context/SocketContext";',
            'import { SocketProvider } from "./notificaciones/SocketContext";'
        ]);
    }
    
    if (p.includes('main.tsx')) {
        replacements.push([
            'import "./styles/app.css";',
            'import "./compartido/estilos/app.css";'
        ]);
    }

    if (p.endsWith('UserDashboard.tsx')) {
        replacements.push(['import { api } from "../lib/api";', 'import { api } from "./compartido/lib/api";']);
        replacements.push(['import { signTyped } from "../lib/eip712";', 'import { signTyped } from "./compartido/lib/eip712";']);
        replacements.push(['import type { Group, UserStats, NotificationHistory } from "../types";', 'import type { Group, UserStats, NotificationHistory } from "./compartido/tipos";']);
        
        replacements.push(['import BottomNav, { Tab } from "./BottomNav";', 'import BottomNav, { Tab } from "./compartido/componentes/BottomNav";']);
        replacements.push(['import InicioTab from "./tabs/InicioTab";', 'import InicioTab from "./grupos/componentes/InicioTab";']);
        replacements.push(['import MovimientosTab from "./tabs/MovimientosTab";', 'import MovimientosTab from "./movimientos/componentes/MovimientosTab";']);
        replacements.push(['import AprobacionesTab from "./tabs/AprobacionesTab";', 'import AprobacionesTab from "./aprobaciones/componentes/AprobacionesTab";']);
        replacements.push(['import UnirseTab from "./tabs/UnirseTab";', 'import UnirseTab from "./unirse/componentes/UnirseTab";']);
        replacements.push(['import MiCuentaTab from "./tabs/MiCuentaTab";', 'import MiCuentaTab from "./cuenta/componentes/MiCuentaTab";']);
        replacements.push(['import Sheet from "./Sheet";', 'import Sheet from "./compartido/componentes/Sheet";']);
        replacements.push(['import GroupForms from "./GroupForms";', 'import GroupForms from "./grupos/componentes/GroupForms";']);
    }

    if (p.includes('InicioTab.tsx') || p.includes('MiCuentaTab.tsx') || p.includes('AprobacionesTab.tsx') || p.includes('MovimientosTab.tsx') || p.includes('UnirseTab.tsx')) {
        replacements.push(['import type { Group } from "../../types";', 'import type { Group } from "../../../compartido/tipos";']);
        replacements.push(['import type { UserStats, Group, NotificationHistory } from "../../types";', 'import type { UserStats, Group, NotificationHistory } from "../../../compartido/tipos";']);
        replacements.push(['import type { Group, Tx, Deposit } from "../../types";', 'import type { Group, Tx, Deposit } from "../../../compartido/tipos";']);
        replacements.push(['import Sheet from "../Sheet";', 'import Sheet from "../../../compartido/componentes/Sheet";']);
    }

    if (p.includes('GroupForms.tsx')) {
        replacements.push(['import type { Group } from "../types";', 'import type { Group } from "../../compartido/tipos";']);
        replacements.push(['import { api } from "../lib/api";', 'import { api } from "../../compartido/lib/api";']);
        replacements.push(['import { signTyped, toWei } from "../lib/eip712";', 'import { signTyped, toWei } from "../../compartido/lib/eip712";']);
    }
    
    if (p.includes('BalanceHero.tsx')) {
        replacements.push(['import type { Group } from "../types";', 'import type { Group } from "../../compartido/tipos";']);
    }
    
    if (p.includes('api.ts') || p.includes('eip712.ts')) {
        replacements.push(['import { ENV } from "../env";', 'import { ENV } from "../../env";']);
        replacements.push(['import type { Group } from "../types";', 'import type { Group } from "../tipos";']);
    }

    replaceInFile(file, replacements);
});
