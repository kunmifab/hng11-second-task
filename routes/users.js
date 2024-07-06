const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();
const { PrismaClient } = require('@prisma/client'); 
const auth = require('../middlewares/auth');
const prisma = new PrismaClient();

  router.get('/:id',auth, async(req, res) => {

    if(req.params.id === req.user.userId){
        const user = await prisma.user.findUnique({
            where: {
                userid: req.params.id
            },
            select: {
                userId: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true
            }
        });

        res.status(200).json({
            "status": "success",
            "message": `Found your record with id: ${req.params.id}`,
            "data": user
        });
    }else{
        const user = await prisma.user.findUnique({
            where: {
                userId: req.params.id
            },
            select: {
                userId: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true
            }
        });

        if(!user){
            console.log('not found')
            res.status(404).json({
                "status": "failed",
                "message": `Not Found`,
            });
        }
        const userInOrgs = await prisma.organisationUser.findMany({
            where: {
                userId: req.user.userId
            }
        });

        let check;
        for (const userInOrg of userInOrgs) {
            check = await prisma.organisationUser.findFirst({
                where: {
                    userId: user.userId,
                    orgId: userInOrg.orgId // should be orgId, not userId
                }
            });
        
            if (check) {
                return res.status(200).json({
                    status: "success",
                    message: `Found record with id: ${req.params.id}`,
                    data: user
                });
            }
        }

        if(!check){
            res.status(404).json({
                "status": "failed",
                "message": `Not Found`,
            });
        }

    }
    
    
  });

module.exports = router;