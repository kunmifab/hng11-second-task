const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();
const { PrismaClient } = require('@prisma/client'); 
const auth = require('../middlewares/auth');
const prisma = new PrismaClient();

router.get('/', auth, async (req, res) => {

  
    try {
  
      const userOrgs = await prisma.organisationUser.findMany({
        where: {
            userId: req.user.userId,
        },
      });

      const orgs = await Promise.all(userOrgs.map(async (userOrg) => {
        return await prisma.organisation.findUnique({
            where: {
                orgId: userOrg.orgId,
            },
            select: {
                orgId: true,
                name: true,
                description: true,
            }
        });
    }));
  
        return res.status(200).json({
          status: "success",
          message: `Found organisations you belong to or created`,
          data: {
            "organisations": orgs
          },
        });
    } catch (error) {
      console.error(error); // Log the error for debugging
      return res.status(500).json({
        status: "failed",
        message: "Internal server error",
      });
    }
  });

router.get('/:orgId', auth, async (req, res) => {
    const requestedOrgId = req.params.orgId;

    try {
  
      const org = await prisma.organisation.findUnique({
        where: {
            orgId: requestedOrgId,
        },
        select: {
            orgId: true,
            name: true,
            description: true,
        }
      });

      if(!org){
        return res.status(404).json({
            status: "Not Found",
            message: `Organisation with id ${requestedOrgId} not found`
          });
      }
  
        return res.status(200).json({
          status: "success",
          message: `Found organisation`,
          data: org,
        });
    } catch (error) {
      console.error(error); // Log the error for debugging
      return res.status(500).json({
        status: "failed",
        message: "Internal server error",
      });
    }
  });

router.post('/', auth, async (req, res) => {
    const { name, description } = req.body;
    
    // Basic validation
    const errors = [];
    if (!name) {
      errors.push({ field: 'name', message: 'Name is required' });
    }
    if (errors.length > 0) {
        return res.status(400).json({
            "status": "Bad Request",
            "message": "Client error",
            "statusCode": 400
        });
      }

    try {
        const newOrg = await prisma.organisation.create({
            data: { 
                name, 
                description, 
                userId: req.user.userId
            },
            select: {
                orgId: true,
                name: true,
                description: true
            }
        });
  
        return res.status(201).json({
          status: "success",
          message: `Organisation created successfully`,
          data: newOrg,
        });
    } catch (error) {
      console.error(error); // Log the error for debugging
      return res.status(500).json({
        status: "failed",
        message: "Internal server error",
      });
    }
  });


router.post('/:orgId/users', async (req, res) => {
    const requestedOrgId = req.params.orgId;
    const { userId } = req.body;
    
    // Basic validation
    const errors = [];
    if (!userId) {
      errors.push({ field: 'userId', message: 'userId is required' });
    }
    if (errors.length > 0) {
        return res.status(400).json({
            "status": "Bad Request",
            "message": "Client error",
            "statusCode": 400
        });
      }

    try {
        const org = await prisma.organisation.findUnique({
            where: {
                orgId: requestedOrgId,
            },
            select: {
                orgId: true,
                name: true,
                description: true,
            }
          });

          if (!org) {
            return res.status(404).json({
                "status": "not found",
                "message": "organisation Not found",
                "statusCode": 404
            });
          }
        const user = await prisma.user.findUnique({
            where: {
                userId: userId,
            }
          });

          if (!user) {
            return res.status(404).json({
                "status": "not found",
                "message": "User Not found",
                "statusCode": 404
            });
          }
        const userInOrg = await prisma.organisation.findUnique({
            where: {
                  userId: userId ,
                  orgId: org.orgId
              },
          });

          if (userInOrg) {
            return res.status(400).json({
                "status": "Bad Request",
                "message": "Already exists",
                "statusCode": 400
            });
          }



          const newOrgUser = await prisma.organisationUser.create({
            data: { 
                userId, 
                orgId: org.orgId,
            }
        });
  
        return res.status(200).json({
          status: "success",
          message: `User added to organisation successfully`,
        });
    } catch (error) {
      console.error(error); // Log the error for debugging
      return res.status(500).json({
        status: "failed",
        message: "Internal server error",
      });
    }
  });
  

module.exports = router;