import express from "express";
import { prisma } from "../utils/prisma/index.js";
import authMiddleware from "../middlewares/auth.middleware.js";
const router = express.Router();

/**캐릭터 등록 */
router.post("/char", authMiddleware, async (req, res, next) => {
  const { charName } = req.body;
  const { userCode } = req.account;

  //아이디 중복검사
  const isExistuser = await prisma.character.findFirst({
    where: { charName },
  });
  if (isExistuser) {
    return res.status(409).json({ message: "이미 존재하는 아이디입니다." });
  }
  //데이터 입력
  const character = await prisma.character.create({
    data: {
      userCode: +userCode,
      charName
    },
  });
  return res.status(201).json({ data: character });
});



/** 게시글 목록 조회 API **/
router.get("/posts", async (req, res, next) => {
  const posts = await prisma.posts.findMany({
    select: {
      postId: true,
      userId: true,
      title: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: {
      createdAt: "desc", // 게시글을 최신순으로 정렬합니다.
    },
  });

  return res.status(200).json({ data: posts });
});

// src/routes/posts.router.js

/** 게시글 상세 조회 API **/
router.get("/posts/:postId", async (req, res, next) => {
  const { postId } = req.params;
  const post = await prisma.posts.findFirst({
    where: {
      postId: +postId,
    },
    select: {
      postId: true,
      userId: true,
      title: true,
      content: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return res.status(200).json({ data: post });
});
export default router;
