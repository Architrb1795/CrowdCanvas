-- RLS Policy Fix for Events Table
-- Fixes an ambiguous column reference issue where unqualified "id" in subqueries resolved to "event_members.id" instead of "events.id"

-- 1. Fix "Event members can view private events"
DROP POLICY IF EXISTS "Event members can view private events" ON events;
CREATE POLICY "Event members can view private events" ON events FOR SELECT USING (
    is_public = false AND EXISTS (SELECT 1 FROM event_members WHERE event_members.event_id = events.id AND event_members.user_id = auth.uid())
);

-- 2. Fix "Event owners and admins can update events"
DROP POLICY IF EXISTS "Event owners and admins can update events" ON events;
CREATE POLICY "Event owners and admins can update events" ON events FOR UPDATE USING (
    EXISTS (SELECT 1 FROM event_members WHERE event_members.event_id = events.id AND event_members.user_id = auth.uid() AND event_members.role IN ('owner', 'admin'))
);

-- 3. Fix "Event owners can delete events"
DROP POLICY IF EXISTS "Event owners can delete events" ON events;
CREATE POLICY "Event owners can delete events" ON events FOR DELETE USING (
    EXISTS (SELECT 1 FROM event_members WHERE event_members.event_id = events.id AND event_members.user_id = auth.uid() AND event_members.role = 'owner')
);
