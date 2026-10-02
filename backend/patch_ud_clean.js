const fs = require('fs');
let code = fs.readFileSync('../frontend/src/UserDashboard.tsx', 'utf8');

// Wipe all handleCancelDeleteProposal declarations
while (code.includes('  const handleCancelDeleteProposal = async (groupId: string) => {')) {
    const idx = code.indexOf('  const handleCancelDeleteProposal = async (groupId: string) => {');
    const endIdx = code.indexOf('  };\n', idx) + 5;
    code = code.slice(0, idx) + code.slice(endIdx);
}

// Ensure there is only one onCancelDeleteProposal prop
code = code.replace(/onCancelDeleteProposal=\{handleCancelDeleteProposal\}\n/g, '');
code = code.replace(/onChangeAdminLeave=\{handleChangeAdminLeave\}/g, 'onChangeAdminLeave={handleChangeAdminLeave}\n              onCancelDeleteProposal={handleCancelDeleteProposal}');

const newMethod = `  const handleCancelDeleteProposal = async (groupId: string) => {
    try {
      const token = await getAccessToken();
      if (!token) return;
      const tid = toast.loading("Cancelando propuesta de eliminación...");
      await api.clearDeleteProposal(token, groupId);
      toast.success("Propuesta cancelada con éxito.", { id: tid });
      fetchGroupDetails(groupId);
    } catch (e: any) {
      toast.error(e.message || "Error al cancelar la propuesta");
    }
  };\n\n`;

code = code.replace('  const loadMissingDetails = async () => {', newMethod + '  const loadMissingDetails = async () => {');

// Fix the dangling useEffects that were left empty:
code = code.replace(/  useEffect\(\(\) => \{\n      \n    \n  \}, \[\]\);\n/g, '');

fs.writeFileSync('../frontend/src/UserDashboard.tsx', code);
