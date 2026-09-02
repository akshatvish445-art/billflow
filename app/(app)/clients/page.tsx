import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ClientsTable from "@/components/ClientsTable";
export default async function ClientsPage(){const user=await requireUser();const clients=await prisma.client.findMany({where:{userId:user.id},include:{_count:{select:{invoices:true}}},orderBy:{createdAt:"desc"}});return <ClientsTable initialClients={clients}/>}
