import express from "express";
import { prisma } from "../utils/prisma/index.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import authMiddleware from "../middlewares/auth.middleware.js";
import { Prisma } from "@prisma/client";
const router = express.Router();

/**   계정 생성   **/
router.post("/sign-up", async (req, res, next) => {
  try {
    const { userId, userName, userPassword, userPasswordConfirm } = req.body;

    //prisma에 account 하나를 불러온다.
    const isExistuser = await prisma.account.findFirst({
      where: { userId },
    });
    if (isExistuser) {
      //아이디 중복검사
      return res.status(409).json({ message: "이미 존재하는 아이디입니다." });
    }
    //비밀번호와 비밀번호 확인이맞는지 검사
    if (userPassword !== userPasswordConfirm) {
      return res.status(409).json({ message: "비밀번호 확인이 틀렸습니다." });
      
    }
    //hash화해서 비밀번호 저장.
    const hashedPassword = await bcrypt.hash(userPassword, 10);

    //account를 create
    const account = await prisma.account.create({
      data: {
        userId,
        userName,
        userPassword: hashedPassword,
      },
    });
    return res.status(201).json({data:account, message: "회원가입이 완료 됐습니다." });
  } catch (err) {
    next(err);
  }
});
/**로그인 */
router.post("/log-in", async (req, res, next) => {
  const { userId, userPassword } = req.body;
  const account = await prisma.account.findFirst({ where: { userId } });
  if (!account)
    return res.status(401).json({ message: "존재하지 않는 아이디 입니다." });
  if (!(await bcrypt.compare(userPassword, account.userPassword)))
    return res.status(401).json({ message: "비밀번호가 일치하지 않습니다." });
  
  //session으로 jwt보냄
  req.session.userCode = account.userCode;
  return res.status(200).json({ message: "로그인 성공!" });
});
// src/routes/users.route.js

/** 사용자 조회 API **/
router.get("/users", authMiddleware, async (req, res, next) => {
  const { userId } = req.user;

  const user = await prisma.users.findFirst({
    where: { userId: +userId },
    select: {
      userId: true,
      email: true,
      createdAt: true,
      updatedAt: true,
      userInfos: {
        // 1:1 관계를 맺고있는 UserInfos 테이블을 조회합니다.
        select: {
          name: true,
          age: true,
          gender: true,
          profileImage: true,
        },
      },
    },
  });

  return res.status(200).json({ data: user });
});

// src/routes/users.router.js

/** 사용자 정보 변경 API **/
router.patch("/users/", authMiddleware, async (req, res, next) => {
  try {
    const { userId } = req.user;
    const updatedData = req.body;

    const userInfo = await prisma.userInfos.findFirst({
      where: { userId: +userId }, //한명을 찾음
    });

    await prisma.$transaction(
      async (tx) => {
        // 트랜잭션 내부에서 사용자 정보를 수정합니다.
        await tx.userInfos.update({
          data: {
            ...updatedData,
          },
          where: {
            userId: userInfo.userId,
          },
        });

        // 변경된 필드만 UseHistories 테이블에 저장합니다.
        for (let key in updatedData) {
          if (userInfo[key] !== updatedData[key]) {
            await tx.userHistories.create({
              data: {
                userId: userInfo.userId,
                changedField: key,
                oldValue: String(userInfo[key]),
                newValue: String(updatedData[key]),
              },
            });
          }
        }
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
      },
    );

    return res
      .status(200)
      .json({ message: "사용자 정보 변경에 성공하였습니다." });
  } catch (err) {
    next(err);
  }
});
export default router;
