import { Router } from "express";
import { requireAuth, AuthenticatedRequest } from "../auth";
import { seedExampleCompany } from "../domain/onboarding/seedExampleCompany";
import { seedMinimalDemo } from "../domain/onboarding/seedMinimalDemo";
import { storage } from "../storage";

const router = Router();

// Self-service ensure demo company for current user
router.post("/seed/ensure", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    console.log('Creating demo company for user:', userId);
    const result = await seedMinimalDemo({ userId });
    console.log('Demo company created:', result.companyId);
    
    res.json({ 
      success: true, 
      companyId: result.companyId,
      message: "Demo company ensured"
    });
  } catch (error) {
    console.error("Error ensuring demo company:", error);
    res.status(500).json({ error: "Failed to ensure demo company" });
  }
});

// Admin backfill endpoint (dev/preview only)
router.post("/seed/backfill", requireAuth, async (req: AuthenticatedRequest, res) => {
  // Check environment flags
  if (!process.env.DEMO_SEED_BULK_ENABLED) {
    return res.status(403).json({ error: "Bulk seeding is disabled" });
  }

  try {
    // This would need to be implemented with user listing
    // For now, just return success as placeholder
    res.json({ 
      success: true,
      message: "Backfill completed (placeholder implementation)"
    });
  } catch (error) {
    console.error("Error in bulk demo seeding:", error);
    res.status(500).json({ error: "Failed to backfill demo companies" });
  }
});

export default router;