import order from "../models/order.model.js";
import product from "../models/product.model.js";
import User from "../models/user.model.js"

export const getAnalyticsData = async()=>{
    const totalUsers = await User.countDocuments();
    const totalproducts = await product.countDocuments();
    const saleData = await order.aggregate([
        {
            $group:{
                _id:null,// it groups all documents together,
                totalsales:{$sum:1},
                totalRevenue:{$sum:"$totalAmount"}
            }
        }
    ])
    const {totalsales,totalRevenue} = saleData[0] || {totalsales:0, totalRevenue:0};
    return{
        users:totalUsers,
        products:totalproducts,
        totalsales,
        totalRevenue
    }
}
export const getDailySalesData = async (startDate, endDate) => {
	try {
		const dailySalesData = await order.aggregate([
			{
				$match: {
					createdAt: {
						$gte: startDate,
						$lte: endDate,
					},
				},
			},
			{
				$group: {
					_id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
					sales: { $sum: 1 },
					revenue: { $sum: "$totalAmount" },
				},
			},
			{ $sort: { _id: 1 } },
		]);

		// example of dailySalesData
		// [
		// 	{
		// 		_id: "2024-08-18",
		// 		sales: 12,
		// 		revenue: 1450.75
		// 	},
		// ]

		const dateArray = getDatesInRange(startDate, endDate);
		// console.log(dateArray) // ['2024-08-18', '2024-08-19', ... ]

		return dateArray.map((date) => {
			const foundData = dailySalesData.find((item) => item._id === date);

			return {
				date,
				sales: foundData?.sales || 0,
				revenue: foundData?.revenue || 0,
			};
		});
	} catch (error) {
		throw error;
	}
};

function getDatesInRange(startDate, endDate) {
	const dates = [];
	let currentDate = new Date(startDate);

	while (currentDate <= endDate) {
		dates.push(currentDate.toISOString().split("T")[0]);
		currentDate.setDate(currentDate.getDate() + 1);
	}

	return dates;
}