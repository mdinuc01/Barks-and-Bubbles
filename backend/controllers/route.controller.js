const Route = require("../models/Route.js")


class RouteController {

  async createRoute(req, res) {
    try {
      let { name, serviceAreas } = req.body;
      const route = await Route.create({ name, serviceAreas, createdBy: req.userId });

      let data = await Route.find({ createdBy: req.userId });

      if (data && route)
        return res.status(200).json({ message: `Route Created Successfully`, data });
    } catch (error) {
      return res.status(500).json({ message: "Internal Server Error", error });

    }
  }

  async getAllRoutes(req, res) {
    try {
      const data = await Route.find({ createdBy: req.userId });

      if (data)
        return res.status(200).json({ message: `Routes found: ${data.length}`, data });
    } catch (error) {
      return res.status(500).json({ message: "Internal Server Error", error });

    }
  }

  async getRoute(req, res) {
    try {
      let { routeId, userId } = req.body;
      const data = await Route.find({ _id: routeId, createdBy: userId });

      if (data)
        return res.status(200).json({ message: `Route found`, data });
    } catch (error) {
      return res.status(500).json({ message: "Internal Server Error", error });

    }
  }

  async updateRoute(req, res) {
    try {
      let { routeId, routeData } = req.body;
      await Route.findOneAndUpdate({ _id: routeId },
        {
          $set: {
            'name': routeData.name,
            'serviceAreas': routeData.serviceAreas
          }
        });

      const data = await Route.find({ createdBy: req.userId });

      if (data)
        return res.status(200).json({ message: `Route Updated Successfully`, data });
      else
        return res.status(404).json({ message: "Route not found" });

    } catch (error) {
      return res.status(500).json({ message: "Internal Server Error", error });

    }
  }

  async deleteRoute(req, res) {
    try {
      let { routeId, userId } = req.body;
      const data = await Route.deleteOne({ _id: routeId, createdBy: userId });

      if (data)
        return res.status(200).json({ message: `Route deleted successfully`, data });
      else
        return res.status(404).json({ message: "Route not found" });

    } catch (error) {
      return res.status(500).json({ message: "Internal Server Error", error });

    }
  }

}

module.exports = new RouteController();