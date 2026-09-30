import { NextResponse } from "next/server";
import { redeemVoucherSchema } from "@/lib/validations/voucher";
import { redeemVoucher, VoucherRedemptionError } from "@/lib/services/voucher";
import { getOptionalUser } from "@/lib/rbac";
import { notifyUser } from "@/lib/services/notification";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = redeemVoucherSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid code" }, { status: 400 });
  }

  const user = await getOptionalUser();

  try {
    const voucher = await redeemVoucher({
      code: parsed.data.code,
      userId: user?.id,
      deviceMac: parsed.data.deviceMac,
    });

    if (user) {
      await notifyUser({
        userId: user.id,
        title: "Voucher redeemed",
        message: `${voucher.code} is now active for ${voucher.durationHours}h.`,
        type: "VOUCHER",
        link: "/dashboard/vouchers",
      });
    }

    return NextResponse.json({
      voucher: {
        code: voucher.code,
        planName: voucher.plan.name,
        durationHours: voucher.durationHours,
        dataCapMB: voucher.dataCapMB,
        price: Number(voucher.price),
        status: voucher.status,
        expiresAt: voucher.expiresAt,
      },
    });
  } catch (err) {
    if (err instanceof VoucherRedemptionError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    console.error(err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
