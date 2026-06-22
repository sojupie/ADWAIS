# Kiosk Header Responsive Layout Design

## Current Layout Issues
1. The header currently shifts to vertical stack (`flex-col`) for all screens below `xl` (1280px).
2. This creates 3 full rows on typical laptop and tablet widths, wasting vertical screen space.
3. Status indicators and the Kiosk controls are centered or misaligned during wraps rather than maximizing horizontal space.

## Proposed Layout Structure

### Component Hierarchy
- **Header**: Main flex container.
  - **Top Row Wrapper**: Flex container containing:
    - Logo (Left aligned)
    - Navigation Menu (Right/Center aligned)
  - **Status & Control Wrapper**: Flex container containing:
    - Status Indicators (Offline badge, Server Offline badge, Username info) (Left aligned)
    - Kiosk Controls (Interactive badge, Pause/Play button) (Right aligned)

### Responsive Breakpoints and Rules
1. **Desktop / Large Screens (`>= xl` / 1280px)**:
   - Everything remains on a single row.
   - Header is `flex-row justify-between items-center`.
   - Top Row Wrapper is styled to fit inline on the left/center.
   - Status & Control Wrapper is styled to fit inline on the right.

2. **Medium Screens / Tablets (Between `md` and `xl` / 768px - 1279px)**:
   - Layout splits into exactly 2 rows.
   - **Row 1**: Logo (left) and Nav links + settings icon (right).
   - **Row 2**: Status indicators (left) and Kiosk Controls (right).
   - Keeps header height compact, preventing 3 rows.

3. **Small Screens / Mobile (`< md` / 768px)**:
   - Layout splits into 3 rows.
   - **Row 1**: Logo (centered).
   - **Row 2**: Nav links (centered/wrapped).
   - **Row 3**: Status indicators (left) and Kiosk Controls (right), maintaining horizontal separation to maximize space.

## Tailwind CSS Classes to Implement
- Main `<header>` container:
  `flex flex-col xl:flex-row justify-between items-center px-6 py-3 xl:py-2.5 bg-brand-bg-secondary gap-4 xl:gap-0`
- Top Row Wrapper:
  `flex flex-col md:flex-row items-center justify-between w-full xl:w-auto gap-4` (Logo and Navigation)
- Status & Control Wrapper:
  `flex flex-row items-center justify-between w-full xl:w-auto gap-4` (Status icons left, Kiosk controller right)
