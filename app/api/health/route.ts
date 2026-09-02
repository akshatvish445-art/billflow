export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
export async function GET(){try{await prisma.$queryRaw`SELECT 1`;return NextResponse.json({ok:true,service:"billflow"})}catch{return NextResponse.json({ok:false,service:"billflow"},{status:503})}}
