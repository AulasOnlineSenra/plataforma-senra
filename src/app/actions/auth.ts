'use server'

import prisma from '@/lib/prisma'

export async function registerUser(data: { name: string, email: string, password: string, role: string }) {
  try {
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email }
    })

    if (existingUser) {
      return { success: false, error: 'Este e-mail já está cadastrado. Tente fazer login.' }
    }

    const newUser = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: data.password, 
        role: data.role,
        avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${data.name}`, 
        status: 'active'
      }
    })

    return { success: true, user: newUser }
  } catch (error) {
    console.error('Erro ao registrar no banco:', error)
    return { success: false, error: 'Erro interno ao criar a conta.' }
  }

}
 export async function loginUser(data: { email: string, password: string }) {
  try {
    const user = await prisma.user.findUnique({
      where: { email: data.email }
    })

    if (!user) {
      return { success: false, error: 'Utilizador não encontrado. Verifique o seu e-mail.' }
    }

    if (user.password !== data.password) {
      return { success: false, error: 'Palavra-passe incorreta.' }
    }

    return { success: true, user }
  } catch (error) {
    console.error('Erro ao iniciar sessão:', error)
    return { success: false, error: 'Erro interno ao iniciar sessão.' }
  }
}