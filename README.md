# 🌱 Farm Pilot

Farm Pilot is a modern, intuitive dashboard application designed for farmers to efficiently manage their agricultural operations. It provides a seamless experience for mapping land, tracking crops, logging daily activities, monitoring soil health, and visualizing farm finances — all in one place.

🔗 **Live Demo:** [farm-pilot-blue.vercel.app](https://farm-pilot-blue.vercel.app/)

> This is the frontend repository. The backend API lives at [farmPilot-backend-api](https://github.com/tamilarasu18/farmPilot-backend-api).

## 📸 Screenshots

| Login / Register | Dashboard |
| :---: | :---: |
| ![Login](public/demo_screenshot/login.png) | ![Dashboard with Data](public/demo_screenshot/landing-page-with-data.png) |
| ![Register](public/demo_screenshot/register.png) | ![Dashboard Empty](public/demo_screenshot/landingpage-without-data.png) |

| Land Management | Daily Logs |
| :---: | :---: |
| ![Land Drawing](public/demo_screenshot/land-drawing-page.png) | ![Daily Logs](public/demo_screenshot/daily-logs-page.png) |
| | ![Create Log](public/demo_screenshot/create-daily-logs.png) |

## 🌟 Features

- **Visual Land Editor**: Draw your land boundaries point-by-point on a custom HTML5 Canvas, divide land into sections, and auto-calculate area — no external map library required.
- **Section & Crop Tracking**: Split land into sections, assign crops, and monitor their progress and growth stages.
- **Daily Activity Logs**: Record daily farming activities (planting, watering, fertilizing, harvesting, etc.) along with weather conditions, crop stages, and associated income & expenses.
- **Soil Health Tracking**: Log soil tests (pH, nutrients, and more) to keep an eye on what really drives your yield.
- **Financial Analytics**: Visualize revenue, expenses, profit trends, and expense breakdowns with interactive charts.
- **Unified Dashboard**: View all your agricultural data at a glance with an intuitive, dynamic interface.

## 🚀 Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **UI Library**: [React 19](https://react.dev/)
- **Language**: TypeScript
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **State Management**: [Zustand](https://zustand-demo.pmnd.rs/)
- **Data Fetching & Caching**: [TanStack React Query](https://tanstack.com/query/latest)
- **Charts**: [Recharts](https://recharts.org/)
- **Land Editor**: Custom HTML5 Canvas engine
- **Deployment**: [Vercel](https://vercel.com/)

## 📦 Installation

1. **Clone the repository**:

   ```bash
   git clone https://github.com/tamilarasu18/farm-pilot.git
   cd farm-pilot
   ```

2. **Install dependencies**:

   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Set up Environment Variables**:
   Create a `.env.local` file in the root directory and add the following:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```

## 🛠️ Running the App

To start the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

> Make sure the [backend API](https://github.com/tamilarasu18/farmPilot-backend-api) is running at the URL set in `NEXT_PUBLIC_API_URL`.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

## 📄 License

This project is licensed under the MIT License.
