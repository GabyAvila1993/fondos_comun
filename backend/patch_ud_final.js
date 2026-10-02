const fs = require('fs');
let code = fs.readFileSync('../frontend/src/UserDashboard.tsx', 'utf8');

const regex = /  useEffect\(\(\) => \{\n      \n\n\n  const handleCancelDeleteProposal = async \([\s\S]*?toast\.error\([\s\S]*?\}\n  \};\n/;

code = code.replace(regex, '');
code = code.replace(/  useEffect\(\(\) => \{\n      \n/, '');

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

fs.writeFileSync('../frontend/src/UserDashboard.tsx', code);
