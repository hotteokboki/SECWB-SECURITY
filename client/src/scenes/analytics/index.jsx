import { Box, useTheme, Typography } from "@mui/material";
import Header from "../../components/Header";
import HorizontalBarChart from "../../components/HorizontalBarChart";
import DualAxisLineChart from "../../components/DualAxisLineChart";
import StatBox from "../../components/StatBox";
import LeaderboardChart from "../../components/LeaderboardChart";
import SEPerformanceTrendChart from "../../components/SEPerformanceTrendChart";
import ScatterPlot from "../../components/BarChart";
import EmailIcon from "@mui/icons-material/Email";
import PointOfSaleIcon from "@mui/icons-material/PointOfSale";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import TrafficIcon from "@mui/icons-material/Traffic";
import HeatmapWrapper from "../../components/MyHeatMap";
import { tokens } from "../../theme";
import { useEffect, useState } from "react";

const Analytics = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(`http://localhost:4000/api/analytics-stats`);
        const data = await response.json();
        
        // Validate data structure
        if (!data?.heatmapStats || !Array.isArray(data.heatmapStats)) {
          throw new Error("Invalid heatmapStats format");
        }
        
        setStats(data);
      } catch (error) {
        console.error("Error fetching analytics stats:", error);
        setStats({ heatmapStats: [] }); // Fallback to empty array
      }
    };
    fetchStats();
  }, []);

  if (!stats) return <Typography>Loading...</Typography>;

  return (
    <Box m="20px">
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Header title="Analytics" subtitle="Welcome to Analytics" />
      </Box>

      {/* Row 1 - StatBoxes */}
      <Box display="flex" flexWrap="wrap" gap="20px" justifyContent="space-between" mt="20px">
        <Box flex="1 1 22%" backgroundColor={colors.primary[400]} display="flex" alignItems="center" justifyContent="center" p="20px">
          <StatBox
            title={stats.totalSocialEnterprises}
            subtitle="SE's Enrolled"
            progress={stats.totalSocialEnterprises / (stats.previousMonthSECount || 1)} // Assuming max 100
            increase={`${stats.previousMonthSECount > 0 
              ? (((stats.totalSocialEnterprises - stats.previousMonthSECount) / stats.previousMonthSECount) * 100).toFixed(2) 
              : 0}%`}
            icon={<EmailIcon sx={{ fontSize: "26px", color: colors.greenAccent[500] }} />}
          />
        </Box>

        <Box flex="1 1 22%" backgroundColor={colors.primary[400]} display="flex" alignItems="center" justifyContent="center" p="20px">
          <StatBox
            title={stats.withMentorship}
            subtitle="SE's with Mentors"
            progress={stats.withMentorship / (stats.totalSocialEnterprises || 1)} // Shows percentage filled
            increase={`${(stats.withMentorship / (stats.totalSocialEnterprises || 1) * 100).toFixed(2)}%`}
            icon={<PointOfSaleIcon sx={{ fontSize: "26px", color: colors.blueAccent[500] }} />}
          />
        </Box>

        <Box flex="1 1 22%" backgroundColor={colors.primary[400]} display="flex" alignItems="center" justifyContent="center" p="20px">
          <StatBox
            title={stats.withoutMentorship}
            subtitle="SEs without mentors"
            progress={stats.withoutMentorship / (stats.totalSocialEnterprises || 1)} // Avoid division by zero
            increase={`${(stats.withoutMentorship / (stats.totalSocialEnterprises || 1) * 100).toFixed(2)}%`}
            icon={<PersonAddIcon sx={{ fontSize: "26px", color: colors.redAccent[500] }} />}
          />
        </Box>

        <Box flex="1 1 22%" backgroundColor={colors.primary[400]} display="flex" alignItems="center" justifyContent="center" p="20px">
        <StatBox
          title={`${stats.growthScoreTotal} ${stats.growthScore?.[0]?.abbr || "N/A"}`}
          subtitle="SE with Significant Growth"
          progress={Math.min(stats.cumulativeGrowth / 100, 1)} // ✅ Cap at 100%
          increase={`${stats.cumulativeGrowth}%`}
          icon={<TrafficIcon sx={{ fontSize: "26px", color: colors.blueAccent[500] }} />}
        />
        </Box>
      </Box>

      {/* SE Performance Trend*/}
      <Box
        gridColumn="span 12"
        gridRow="span 2"
        backgroundColor={colors.primary[400]}
        paddingTop="5px"
        marginTop="10px"
      >
        <SEPerformanceTrendChart />{" "}
        {/* ✅ Embed the SEPerformanceChart component here */}
      </Box>

      {/* Row 2 - Horizontal Bar Charts */}
      <Box display="flex" flexWrap="wrap" gap="20px" justifyContent="space-between" mt="20px">

        {/* Overall SE Performance */}
        <Box flex="1 1 100%" height="300px" backgroundColor={colors.primary[400]} p="20px">
          <Typography variant="h3" fontWeight="bold" color={colors.greenAccent[500]}>
            {stats.categoricalScoreForAllSE?.length > 0 ? "Overall SE Performance" : ""}
          </Typography>
          <Box height="100%" display="flex" justifyContent="center" alignItems="center">
            {stats.categoricalScoreForAllSE?.length > 0 ? (
              <HorizontalBarChart 
                data={stats.categoricalScoreForAllSE.map(score => ({
                  category: score.category, 
                  score: parseFloat(score.score) || 0
                }))} 
                type="categoricalScoreForAllSE"
              />
            ) : (
              <Typography variant="h6" color={colors.grey[300]} textAlign="center">
                No Available Data
              </Typography>
            )}
          </Box>
        </Box>

      </Box>

      {/* Row 3 - Social Enterprise Performance Heatmap
      <Box display="flex" flexWrap="wrap" gap="20px" justifyContent="space-between" mt="20px">

        <Box flex="1 1 100%" minHeight="400px" backgroundColor={colors.primary[400]} p="20px">
          <Typography variant="h3" fontWeight="bold" color={colors.greenAccent[500]}>
            {stats?.heatmapStats?.length > 0 ? "Social Enterprise Performance Heatmap" : ""}
          </Typography>
          <Box flex="1" display="flex" justifyContent="center" alignItems="center">
            {stats?.heatmapStats?.length > 0 ? (
              <Box width="100%" height="100%">
                <HeatmapChart heatmapData={Array.isArray(stats?.heatmapStats) ? stats.heatmapStats : []} />
              </Box>
            ) : (
              <Typography variant="h6" color={colors.grey[300]} textAlign="center">
                No Available Data
              </Typography>
            )}
          </Box>
        </Box>

      </Box> */}

{/* Main container to ensure sections don't overlap */}
<Box display="flex" flexDirection="column" gap="20px" mt="20px">

  {/* Row 3 - Social Enterprise Performance Heatmap */}
  <Box width="100%" minHeight="400px" minWidth="300px" p={2} backgroundColor={colors.primary[400]}>
    <Typography variant="h4" fontWeight="bold" color={colors.greenAccent[500]}>
        Heat Map
    </Typography>
    <HeatmapWrapper />
  </Box>

  {/* Row 4 - Leaderboard */}
  <Box display="flex" flexDirection="column" gap="20px">
    <Box width="100%" height="300px" backgroundColor={colors.primary[400]} p="20px">
      <Typography variant="h4" fontWeight="bold" color={colors.greenAccent[500]}>
        {stats?.leaderboardData?.length > 0 ? "Leaderboard - Ratings" : ""}
      </Typography>
      <Box height="100%">
        {stats?.leaderboardData ? (
          stats.leaderboardData.length > 0 ? (
            <LeaderboardChart data={stats.leaderboardData} />
          ) : (
            <Typography variant="h6" color={colors.grey[300]} textAlign="center">
              Leaderboards Unavailable
            </Typography>
          )
        ) : (
          <Typography variant="h6" color="red" textAlign="center">
            Error loading data
          </Typography>
        )}
      </Box>
    </Box>
  </Box>

</Box>

      {/* Row 4 - Line & Scatter Charts */}
      <Box display="flex" flexWrap="wrap" gap="20px" justifyContent="space-between" mt="20px">

        {/* Improvement Score Over Time */}
        <Box flex="1 1 48%" height="300px" backgroundColor={colors.primary[400]} p="20px">
          <Typography variant="h3" fontWeight="bold" color={colors.greenAccent[500]}>
            {stats?.improvementScore?.length > 0 ? "Average Improvement Score Over Time" : ""}
            {/* ✅ Show title only if data exists */}
          </Typography>
          <Box height="100%" display="flex" justifyContent="center" alignItems="center">
            {(() => {
              try {
                if (!stats?.improvementScore) throw new Error("Data not found");
                if (stats.improvementScore.length === 0) {
                  return (
                    <Typography variant="h6" color={colors.grey[300]} textAlign="center">
                      No Available Data
                    </Typography>
                  );
                }
                return (
                  <DualAxisLineChart 
                    data={[{
                      id: "Improvement Score",
                      data: stats.improvementScore.map(point => ({ 
                        x: point.month?.substring(0, 7) || "Unknown", 
                        y: parseFloat(point.overall_avg_improvement) || 0 
                      }))
                    }]} 
                  />
                );
              } catch (error) {
                return (
                  <Typography variant="h6" color="red" textAlign="center">
                    Error loading data
                  </Typography>
                );
              }
            })()}
          </Box>
        </Box>

        {/* Evaluation Score Distribution */}
        <Box flex="1 1 48%" height="300px" backgroundColor={colors.primary[400]} p="20px">
          <Typography variant="h3" fontWeight="bold" color={colors.greenAccent[500]}>
            {stats?.evaluationScoreDistribution?.length > 0 ? "Evaluation Score Distribution" : ""}
            {/* ✅ Show title only if data exists */}
          </Typography>
          <Box height="100%" display="flex" justifyContent="center" alignItems="center">
            {(() => {
              try {
                if (!stats?.evaluationScoreDistribution) throw new Error("Data not found");
                if (stats.evaluationScoreDistribution.length === 0) {
                  return (
                    <Typography variant="h6" color={colors.grey[300]} textAlign="center">
                      No Available Data
                    </Typography>
                  );
                }
                return <ScatterPlot data={stats.evaluationScoreDistribution} />;
              } catch (error) {
                return (
                  <Typography variant="h6" color="red" textAlign="center">
                    Error loading data
                  </Typography>
                );
              }
            })()}
          </Box>
        </Box>

      </Box>

    </Box>
  );
};

export default Analytics;
