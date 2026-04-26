?import fs from 'fs'
import path from 'path'

const filePath = path.join(process.cwd(), 'src/app/dashboard/page.tsx')
let content = fs.readFileSync(filePath, 'utf8')

// Atualizar o nome do aluno
content = content.replace(
  /<p className="font-medium text-slate-900">Aluno<\/p>/,
  '<p className="font-medium text-slate-900">{tx.student?.name || \'Aluno\'}<\/p>'
)

// Atualizar o ID do aluno
content = content.replace(
  /IstudentId\?\.substring\(0, 8\) \|\| 'N\/A'}.../,
  'ID: {(tx.studentId || tx.id)?.substring(0, 8)}...'
)

// Atuatlizar o Avatar Fallback
content = content.replace(
  /<AvatarFallback className="bg-amber-100 text-amber-700 text-xs">\s+A\s+<\/AvatarFallback>/,
  '<AvatarFallback className="bg-amber-100 text-amber-700 text-xs">\n                                    {tx.student?.name?.charAt(0) || \'A\'}\n                                  <\/AvatarFallback>'
)

fs.writeFileSync(filePath, content)
console.log('UI updated successfully via script')
